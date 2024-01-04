<?php 

// This code is used in the Wordpress CMS to act as a backend for the frontend code.
// It is located in a wordpress theme folder

function add_player_role() {
    add_role('player', 'Player', array(
        'read' => true,  // Allows a user to read posts, which is a safe default.
        'edit_posts' => false,
        'delete_posts' => false, // Use false to explicitly deny
    ));
}


add_action('init', 'add_player_role');



// Register user
add_action('rest_api_init', function () {
    register_rest_route('wp/v2', '/register/', array(
        'methods' => 'POST',
        'callback' => 'my_custom_user_registration',
    ));
});


function my_custom_user_registration(WP_REST_Request $request) {
    $username = sanitize_text_field($request['username']);
    $email = sanitize_email($request['email']);
    $password = sanitize_text_field($request['password']);
    $confirm_password = sanitize_text_field($request['confirm_password']);


    $errors = new WP_Error();


    if (empty($username)) {
        $errors->add('empty_username', 'Username field is empty');
    }


    if (empty($email) || !is_email($email)) {
        $errors->add('invalid_email', 'Email field is empty or invalid');
    }


    if (empty($password)) {
        $errors->add('empty_password', 'Password field is empty');
    }


    if ($password !== $confirm_password) {
        $errors->add('password_mismatch', 'Passwords do not match');
    }


    if (username_exists($username)) {
        $errors->add('username_exists', 'Username already exists');
    }


    if (email_exists($email)) {
        $errors->add('email_exists', 'Email already exists');
    }


    if ($errors->has_errors()) {
        $error_messages = array();
        foreach ($errors->get_error_messages() as $message) {
            array_push($error_messages, $message);
        }
        return new WP_REST_Response(array('errors' => $error_messages), 400);
    }


    $user_id = wp_create_user($username, $password, $email);


    if (is_wp_error($user_id)) {
        $error_messages = array();
        foreach ($user_id->get_error_messages() as $message) {
            array_push($error_messages, $message);
        }
        return new WP_REST_Response(array('errors' => $error_messages), 400);
    } else {
        $user = new WP_User($user_id);
        $user->set_role('player');
    }


    return new WP_REST_Response(array('message' => 'User registered'), 200);
}


// Login user
add_action('rest_api_init', function () {
    register_rest_route('wp/v2', '/login/', array(
        'methods' => 'POST',
        'callback' => 'custom_login_user',
    ));
});


function generate_jwt_token($user) {
    require_once get_template_directory() . '\php-jwt-main\php-jwt-main\src\JWT.php';


    $issuedAt = time();
    $expirationTime = $issuedAt + 3600;  // JWT valid for 1 hour from the issued time
    $payload = array(
        'iss' => get_bloginfo('url'),  // Issuer
        'iat' => $issuedAt,            // Issued at
        'exp' => $expirationTime,      // Expire
        'uid' => $user->ID             // User ID
    );


    $jwt = JWT::encode($payload, 'lewMQR6lZasm9YTAdtXr7abhFbO7Vj5E'); // Replace with your actual secret key
    return $jwt;
}


function custom_login_user(WP_REST_Request $request) {
    $credentials = array();
    $credentials['user_login'] = $request['username'];
    $credentials['user_password'] = $request['password'];
    $credentials['remember'] = true;


    $user = wp_signon($credentials, false);


    if (is_wp_error($user)) {
        return new WP_REST_Response(array('error' => $user->get_error_message()), 401);
    }


    // Generate JWT token
    $token = generate_jwt_token($user); // Implement this function based on your JWT generation logic


    // Set HTTP-only cookie with the token
    setcookie('jwt_auth', $token, [
        'expires' => time() + DAY_IN_SECONDS,
        'path' => '/',
        'secure' => true, // Set to true if using HTTPS
        'httponly' => true,
        'samesite' => 'Lax' // or 'Strict' based on your requirements
    ]);


    return new WP_REST_Response(array('message' => 'Login successful'), 200);
}


add_action('rest_api_init', function () {
    register_rest_route('wp/v2', '/score/', array(
        'methods' => 'POST',
        'callback' => 'save_game_score',
        'permission_callback' => function () {
            return current_user_can('player');
        }
    ));
});


function save_game_score(WP_REST_Request $request) {
    global $wpdb; // This gives you access to the database
    $score = $request->get_param('score');
    $user_id = get_current_user_id(); // This gets the ID of the currently authenticated user


    // Prepare the data for insertion
    $data = array(
        'user_id' => $user_id,
        'score' => $score,
        'date_recorded' => current_time('mysql', 1)
    );


    // Insert the data into the table
    $result = $wpdb->insert('wp_1015559_game_scores', $data);


    if (false === $result) {
        return new WP_REST_Response('Error saving score', 500);
    }


    return new WP_REST_Response('Score saved successfully', 200);
}


// Fetch top 10 scores
// Inside functions.php


function get_top_scores() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'game_scores';


    $query = "SELECT user_id, score FROM {$table_name} ORDER BY score DESC LIMIT 10";
    $top_scores = $wpdb->get_results($query, ARRAY_A);


    foreach ($top_scores as $key => $score) {
        $user_info = get_userdata($score['user_id']);
        $top_scores[$key]['username'] = $user_info->user_login; // Or another field that contains the username
        $attach_id = get_user_meta($score['user_id'], 'profile_picture', true);
        $top_scores[$key]['profile_pic'] = $attach_id ? wp_get_attachment_url($attach_id) : ''; // Add profile picture URL
    }


    return $top_scores;
}





// Register REST API endpoint
add_action('rest_api_init', function () {
    register_rest_route('wp/v2', '/top-scores/', array(
        'methods' => 'GET',
        'callback' => 'get_top_scores'
    ));
});


// Fetch best score for a user
function get_user_best_score($user_id) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'game_scores'; // Make sure this is your actual table name


    $query = $wpdb->prepare("SELECT MAX(score) as best_score FROM {$table_name} WHERE user_id = %d", $user_id);
    $best_score = $wpdb->get_var($query);


    return $best_score;
}


// Register REST API endpoint
add_action('rest_api_init', function () {
    register_rest_route('wp/v2', '/user-best-score/', array(
        'methods' => 'GET',
        'callback' => function (WP_REST_Request $request) {
            $user_id = get_current_user_id();
            if ($user_id) {
                return new WP_REST_Response(get_user_best_score($user_id), 200);
            } else {
                return new WP_REST_Response('User not found', 404);
            }
        },
        'permission_callback' => function () {
            return is_user_logged_in(); // Make sure the user is logged in
        }
    ));
});


// Endpoint for uploading profile picture
add_action('rest_api_init', function () {
    register_rest_route('wp/v2', '/upload-profile-picture/', array(
        'methods' => 'POST',
        'callback' => 'upload_profile_picture',
        'permission_callback' => function () {
            return is_user_logged_in();
        }
    ));
});


function upload_profile_picture(WP_REST_Request $request) {
    require_once(ABSPATH . 'wp-admin/includes/media.php');
    require_once(ABSPATH . 'wp-admin/includes/file.php');
    require_once(ABSPATH . 'wp-admin/includes/image.php');


    // Handle file upload
    $file_handler = 'image'; // key in $_FILES array
    $attach_id = media_handle_upload($file_handler, 0);


    if (is_wp_error($attach_id)) {
        return new WP_REST_Response(array('error' => $attach_id->get_error_message()), 400);
    }


    // Save the attachment ID in user meta
    $user_id = get_current_user_id();
    update_user_meta($user_id, 'profile_picture', $attach_id);


    return new WP_REST_Response(array('message' => 'Profile picture uploaded', 'attachment_id' => $attach_id), 200);
}


// Endpoint for retrieving profile picture
add_action('rest_api_init', function () {
    register_rest_route('wp/v2', '/get-profile-picture/', array(
        'methods' => 'GET',
        'callback' => 'get_profile_picture',
        'permission_callback' => function () {
            return is_user_logged_in();
        }
    ));
});


function get_profile_picture(WP_REST_Request $request) {
    $user_id = get_current_user_id();
    $attach_id = get_user_meta($user_id, 'profile_picture', true);


    if (!$attach_id) {
        return new WP_REST_Response(array('error' => 'No profile picture set'), 404);
    }


    $image_url = wp_get_attachment_url($attach_id);


    return new WP_REST_Response(array('profilePictureUrl' => $image_url), 200);
}