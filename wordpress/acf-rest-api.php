<?php
/**
 * Expose ACF fields in WooCommerce REST API responses.
 *
 * Add this to your theme's functions.php or as a simple plugin
 * (create /wp-content/plugins/anvil-acf-rest/anvil-acf-rest.php
 *  with a plugin header, then paste this code below it).
 *
 * Prerequisites: ACF (free or Pro) must be installed and the
 * "Anvil Product Details" field group must be created.
 */

add_action( 'rest_api_init', function () {

    $acf_fields = [
        'subtitle',
        'what_it_is_subtitle',
        'what_it_is_body',
        'composition_body',
        'documentation_section_heading',
        'documentation_caption',
        'shipping_type',
    ];

    // Register simple scalar fields
    foreach ( $acf_fields as $field ) {
        register_rest_field(
            'product',
            'acf_' . $field,
            [
                'get_callback' => function ( $object ) use ( $field ) {
                    return get_field( $field, $object['id'] );
                },
                'schema' => [ 'type' => 'string' ],
            ]
        );
    }

    // Register repeater / complex fields (returned as arrays)
    $complex_fields = [
        'trust_badges',
        'research_applications',
        'documentation_metrics',
        'properties_table',
        'related_products_override',
    ];

    foreach ( $complex_fields as $field ) {
        register_rest_field(
            'product',
            'acf_' . $field,
            [
                'get_callback' => function ( $object ) use ( $field ) {
                    $value = get_field( $field, $object['id'] );
                    return $value ?: [];
                },
                'schema' => [ 'type' => 'array' ],
            ]
        );
    }

    // documentation_file returns URL string
    register_rest_field(
        'product',
        'acf_documentation_file',
        [
            'get_callback' => function ( $object ) {
                $file = get_field( 'documentation_file', $object['id'] );
                if ( is_array( $file ) ) return $file['url'] ?? null;
                return $file ?: null;
            },
            'schema' => [ 'type' => 'string' ],
        ]
    );
} );
