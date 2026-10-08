<?php
define('ABSPATH', '/tmp/');
define('WP_CLI', true);
define('TRICHIS_CORE_DIR', getcwd() . '/wordpress/plugins/trichis-core');
function add_filter(...$args) {}
require TRICHIS_CORE_DIR . '/includes/media-fields.php';
require TRICHIS_CORE_DIR . '/includes/blocks.php';
$fields = [];
function collect($value) {
    global $fields;
    if (!is_array($value)) return;
    if (isset($value['key'], $value['name']) && str_starts_with($value['key'], 'field_')) {
        if (isset($fields[$value['key']])) throw new Exception('Duplicate ACF key: ' . $value['key']);
        $fields[$value['key']] = $value;
    }
    foreach ($value as $child) if (is_array($child)) collect($child);
}
foreach (['page','project','service'] as $ctx) collect(trichis_page_blocks_field($ctx, trichis_blocks_for_context($ctx)));
collect(trichis_block_form_section('footer'));
function acf_get_field($key) { return $GLOBALS['fields'][$key] ?? null; }
class WP_CLI {
    static function add_command($name, $callback) { $GLOBALS['command'] = $callback; }
    static function error($message) { throw new Exception($message); }
    static function success($message) {}
    static function log($message) {}
}
$raw = [
    ['acf_fc_layout'=>'home_hero', 'field_page_blk_home_hero_media'=>123, 'field_page_blk_home_hero_mobile_media'=>124],
    ['acf_fc_layout'=>'home_who_we_are', 'body'=>'Existing'],
    ['acf_fc_layout'=>'home_what_we_do','services'=>[['label'=>'Identity','link'=>'/service/identity','media'=>125]]],
    ['acf_fc_layout'=>'how_we_do_it','title'=>'Old','cards'=>[]],
    ['acf_fc_layout'=>'home_what_weve_created'],
    ['acf_fc_layout'=>'form_section','form_name'=>'contact','form_fields'=>[['name'=>'email','field_type'=>'email']]],
];
$state = ['field_page_page_blocks' => $raw, 'field_footer_form'=>['form_fields'=>false], 'field_footer_cta_title'=>'Old', 'field_footer_form_enabled'=>false];
$options = []; $writes = 0;
function get_posts($args) { return $args['post_type']==='page' ? [1] : [(object)['ID'=>2,'post_name'=>'example']]; }
function get_field($key, $id, $formatted = true) { return $GLOBALS['state'][$key] ?? null; }
function update_field($key,$value,$id) { $GLOBALS['state'][$key]=$value; $GLOBALS['writes']++; }
function get_option($key) { return $GLOBALS['options'][$key] ?? false; }
function add_option($key,$value,...$args) { $GLOBALS['options'][$key]=$value; }
function delete_option($key) { unset($GLOBALS['options'][$key]); }
function check($condition, $message) { if (!$condition) throw new Exception($message); }
require TRICHIS_CORE_DIR . '/includes/cli/home-design.php';
$command([], []);
check($writes===0,'Dry run mutated data');
$command([], ['apply'=>true]);
check(count($state['field_page_page_blocks'])===5,'Expected 5 sections');
check($state['field_page_page_blocks'][0]['media']===123,'Hero media was not preserved');
check($state['field_page_page_blocks'][0]['fullscreen']===true,'Fullscreen not enabled');
check($state['field_page_page_blocks'][2]['services'][0]['media']===125,'Service media was not preserved');
check($state['field_footer_form']['form_name']==='contact','Existing form key was not preserved');
check($state['field_page_page_blocks'][4]['project_rows'][0]['project_slug']==='example','CMS project was not selected');
$count=$writes;
$command([], ['apply'=>true]);
check($writes===$count,'Rerun overwrote edits');
$command([], ['restore'=>true]);
check($state['field_page_page_blocks']===$raw,'Restore did not recover original blocks');
check($state['field_footer_cta_title']==='Old','Restore did not recover footer');
echo "ACF keys unique; migration dry-run, apply, media retention, form transfer, idempotence and restore passed.\n";
