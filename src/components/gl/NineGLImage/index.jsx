import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useVideoTexture } from "@react-three/drei";
import {
  MeshBasicNodeMaterial,
  Vector2,
  Vector3,
  PlaneGeometry,
} from "three/webgpu";
import {
  uv,
  uniform,
  vec2,
  vec4,
  float,
  mix,
  texture as tslTexture,
  Fn,
} from "three/tsl";
import {
  scaleUV,
  translateUV,
  roundedBorder,
  greyscale,
  mapRange,
} from "@/lib/gl/shaderChunks";
import { useImageAsTexture } from "@/lib/gl/useImageAsTexture";
import useAnimation from "@/hooks/useAnimation";
import { EASE_CUSTOM_4 } from "@/lib/easing";
import { lerp, map } from "@/lib/math";
import { mouseState } from "@/lib/mouse";
import { useGlobalStore } from "@/stores/global";
import NineGLImageOverlay from "./NineGLImageOverlay";

const sharedGeometry = new PlaneGeometry(1, 1, 1, 1);
const _local = new Vector3();

function buildImageMaterial({ map, darken = 0 }) {
  const uTransition = uniform(0);
  const uCursorTransition = uniform(0);
  const uGrayScale = uniform(0);
  const uDarken = uniform(darken);
  const uElementSize = uniform(new Vector2(1, 1));
  const uImageDimensions = uniform(new Vector2(1, 1));
  const uImageOffset = uniform(new Vector2(0, 0));
  const uImageScale = uniform(new Vector2(1, 1));
  const mapNode = tslTexture(map);

  const material = new MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;

  material.fragmentNode = Fn(() => {
    const st = uv();
    let textureUV = float(0.5).add(st.sub(0.5).div(uImageDimensions)).toVar();
    textureUV.assign(translateUV(textureUV, uImageOffset));
    textureUV.assign(scaleUV(textureUV, uImageScale, vec2(0.5)));

    const transitionScale = mapRange(
      uTransition,
      float(0),
      float(1),
      float(2),
      float(1),
    ).mul(
      mapRange(uCursorTransition, float(0), float(1), float(1), float(1.2)),
    );
    textureUV.assign(scaleUV(textureUV, vec2(transitionScale), vec2(0.5)));

    const sampled = mapNode.sample(textureUV);
    const border = roundedBorder(float(0), float(10), st, uElementSize);
    const inside = border.y;

    let final = sampled.rgb.toVar();
    final.assign(mix(final, final.mul(0.75), uCursorTransition));
    final.assign(final.mul(float(1).sub(uDarken)));
    final.assign(greyscale(final, uGrayScale));

    return vec4(final, inside.mul(uTransition).mul(sampled.a));
  })();

  return {
    material,
    uniforms: {
      uTransition,
      uCursorTransition,
      uGrayScale,
      uDarken,
      uElementSize,
      uImageDimensions,
      uImageOffset,
      uImageScale,
    },
    setMap: (tex) => {
      mapNode.value = tex;
    },
  };
}

const NineGLImageImpl = forwardRef(function NineGLImageImpl(
  {
    scale,
    tMap = null,
    isLink = true,
    useHover = true,
    hide = false,
    darken = 0,
    inViewport = true,
    onAnimateInComplete,
    onReady,
    i = 0,
    src,
    ...props
  },
  ref,
) {
  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  const mesh = useRef();
  const group = useRef();
  const overlay = useRef();
  const visible = useRef(false);
  const hasAnimatedIn = useRef(false);
  const [rot, _rot] = useMemo(() => [new Vector2(), new Vector2()], []);

  const built = useMemo(() => {
    if (!tMap) return null;
    return buildImageMaterial({ map: tMap, darken });
  }, [tMap, darken]);

  useEffect(() => {
    if (!tMap || !built) return;
    const mediaEl = tMap.source?.data || tMap.image;
    const textureWidth =
      mediaEl?.videoWidth || mediaEl?.width || tMap.image?.width || 0;
    const textureHeight =
      mediaEl?.videoHeight || mediaEl?.height || tMap.image?.height || 0;
    if (!textureWidth || !textureHeight) return;

    const sx = scale?.x || 1;
    const sy = scale?.y || 1;
    built.uniforms.uElementSize.value.set(sx, sy);

    const imageRatio = textureWidth / textureHeight;
    const meshAspect = sx / sy || 1;
    let scaleWidth = 1;
    let scaleHeight = 1;
    if (imageRatio > meshAspect) scaleWidth = imageRatio / meshAspect;
    else if (imageRatio < meshAspect) scaleHeight = meshAspect / imageRatio;
    built.uniforms.uImageDimensions.value.set(scaleWidth, scaleHeight);
    built.setMap(tMap);
    onReady?.();
  }, [tMap, scale, built, onReady]);

  const {
    animateIn: animateInUp,
    animateOut: animateOutUp,
    isActive: isInUpActive,
  } = useAnimation({
    inParams: {
      ease: EASE_CUSTOM_4,
      duration: isMobileLayout ? 1 : 1.4,
      onUpdate: (v) => {
        group.current?.scale.setScalar(map(v, 0, 1, 0.5, 1));
        if (built) built.uniforms.uTransition.value = v;
      },
      onComplete: () => onAnimateInComplete?.(),
    },
    outParams: {
      duration: 0,
      onUpdate: (v) => {
        if (built) built.uniforms.uTransition.value = v;
      },
    },
  });

  const { animateIn: onZoomIn, animateOut: onZoomOut } = useAnimation({
    inParams: {
      ease: EASE_CUSTOM_4,
      duration: 1,
      onUpdate: (v) => {
        if (built) built.uniforms.uCursorTransition.value = v;
      },
    },
    outParams: {
      ease: EASE_CUSTOM_4,
      duration: 1,
      onUpdate: (v) => {
        if (built) built.uniforms.uCursorTransition.value = v;
      },
    },
  });

  // If a sibling suspends (video texture loading), React hides this subtree
  // and disconnects effects, killing an in-flight entrance tween. On reveal,
  // snap to the final state instead of staying frozen mid-animation.
  useEffect(() => {
    if (!built || !hasAnimatedIn.current || isInUpActive()) return;
    built.uniforms.uTransition.value = 1;
    group.current?.scale.setScalar(1);
    if (mesh.current && !hide) mesh.current.visible = visible.current;
  }, [built, hide, isInUpActive]);

  function resetAndPlayVideo(currentTexture) {
    const el = currentTexture?.source?.data || currentTexture?.image;
    if (!el?.play) return;
    el.currentTime = 0;
    el.play()?.catch?.(() => {});
  }

  function handlePointerOver(_, override = false) {
    if (!visible.current || !useHover || isMobileLayout) return;
    if (!isLink && !override) return;
    if (!isMobileLayout) onZoomIn();
    overlay.current?.animateIn();
  }

  function handlePointerOut(_, override = false) {
    if (!useHover || isMobileLayout) return;
    if (!isLink && !override) return;
    onZoomOut();
    overlay.current?.animateOut();
  }

  useImperativeHandle(ref, () => ({
    animateIn: () => {
      if (!mesh.current || hasAnimatedIn.current) return;
      hasAnimatedIn.current = true;
      resetAndPlayVideo(tMap);
      animateInUp();
      if (!hide) {
        visible.current = true;
        mesh.current.visible = true;
      }
    },
    animateOut: () => {
      if (!mesh.current || !visible.current) return;
      animateOutUp();
      if (!hide) {
        visible.current = false;
        mesh.current.visible = false;
      }
      hasAnimatedIn.current = false;
    },
    group: group.current,
    getGroup: () => group.current,
    visible: () => visible.current,
    playVideo: () => resetAndPlayVideo(tMap),
    stopVideo: () => {
      const el = tMap?.source?.data || tMap?.image;
      el?.pause?.();
    },
    seekVideo: (time) => {
      const el = tMap?.source?.data || tMap?.image;
      if (el) el.currentTime = time;
    },
    triggerPointerOver: () => handlePointerOver(null, true),
    triggerPointerOut: () => handlePointerOut(null, true),
    getElementSize: () => scale,
  }));

  useFrame((state, delta) => {
    if (!useHover || !inViewport || isMobileLayout || !group.current) return;
    const { raycaster, camera } = state;
    raycaster.setFromCamera(
      { x: mouseState.normalized.x, y: mouseState.normalized.y },
      camera,
    );
    const hits = mesh.current
      ? raycaster.intersectObject(mesh.current, true)
      : [];
    if (hits.length > 0) {
      mesh.current.updateWorldMatrix(true, false);
      _local.copy(hits[0].point);
      mesh.current.worldToLocal(_local);
      rot.set(_local.x, _local.y);
    } else {
      rot.set(0, 0);
    }
    _rot.x = lerp(rot.x, _rot.x, 0.1, delta);
    _rot.y = lerp(rot.y, _rot.y, 0.1, delta);
    const m = 0.25;
    group.current.rotation.set(_rot.y * -m, _rot.x * m, 0);
  });

  if (!built || !tMap) return null;

  const sx = scale?.x || 1;
  const sy = scale?.y || 1;

  return (
    <group ref={group} {...props}>
      <mesh
        ref={mesh}
        name={`NineGLImage-${i}-${src || ""}`}
        scale={[sx, sy, 1]}
        geometry={sharedGeometry}
        visible={false}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <primitive object={built.material} attach="material" />
      </mesh>
      {!isMobileLayout && isLink && (
        <NineGLImageOverlay z={0.5} scale={scale} ref={overlay} />
      )}
    </group>
  );
});

function WithVideoTexture({ src, video, children }) {
  const url = video?.streamingUrl || video?.mp4Url || src || null;
  const texture = useVideoTexture(url, {
    crossOrigin: "anonymous",
    unsuspend: "canplay",
  });
  return children(texture);
}

function WithImageRefTexture({ imgRef, children }) {
  const texture = useImageAsTexture(imgRef);
  return texture ? children(texture) : null;
}

const NineGLImage = forwardRef(function NineGLImage(props, ref) {
  const { tMap, isVideo, src, imgRef } = props;
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    if (tMap) gl.initTexture?.(tMap);
  }, [gl, tMap]);

  if (tMap) return <NineGLImageImpl ref={ref} {...props} tMap={tMap} />;

  if (isVideo) {
    return (
      <WithVideoTexture src={src} video={props.video}>
        {(texture) => <NineGLImageImpl ref={ref} {...props} tMap={texture} />}
      </WithVideoTexture>
    );
  }

  return (
    <WithImageRefTexture imgRef={imgRef}>
      {(texture) => <NineGLImageImpl ref={ref} {...props} tMap={texture} />}
    </WithImageRefTexture>
  );
});

export default NineGLImage;
