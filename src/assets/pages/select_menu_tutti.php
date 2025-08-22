<?php
ob_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// Connessione al DB
$host = '31.11.39.22';
$dbname = 'Sql1503239_1';
$user = 'Sql1503239';
$pass = 'u4678n4916';

$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) {
    die(json_encode(['error' => 'Connessione fallita: ' . $conn->connect_error]));
}

$lat = isset($_REQUEST['latitudine']) ? floatval($_REQUEST['latitudine']) : null;
$lon = isset($_REQUEST['longitudine']) ? floatval($_REQUEST['longitudine']) : null;
$maxDistanza = isset($_REQUEST['max']) ? floatval($_REQUEST['max']) : 10;

if (is_null($lat) || is_null($lon)) {
    die(json_encode(['error' => 'Latitudine e longitudine sono obbligatorie.']));
}

$sql = "
SELECT 
    t.id_menu,
    t.descrizione_menu,
    t.prezzo,
    t.nome_locale,
    t.latitudine,
    t.longitudine,
    t.distance
FROM (
    SELECT 
        m.id_menu,
        m.descrizione_menu,
        m.prezzo,
        l.nome_locale,
        l.latitudine,
        l.longitudine,
        (
            6371 * acos(
                cos(radians($lat)) *
                cos(radians(l.latitudine)) *
                cos(radians(l.longitudine) - radians($lon)) +
                sin(radians($lat)) *
                sin(radians(l.latitudine))
            )
        ) AS distance
    FROM menu m
    JOIN locali l ON m.id_locale = l.id_locale
    WHERE CURDATE() BETWEEN m.data_menu_inizio AND m.data_menu_fine
) t
WHERE t.distance <= $maxDistanza
ORDER BY t.distance ASC
";

$result = $conn->query($sql);

if (!$result) {
    die(json_encode(['error' => 'Errore nella query: ' . $conn->error]));
}

if ($result->num_rows > 0) {
    $menu = [];
    while ($row = $result->fetch_assoc()) {
        $menu[] = [
            'id' => $row['id_menu'],
            'nome_locale' => $row['nome_locale'],
            'descrizione' => $row['descrizione_menu'],
            'prezzo' => floatval($row['prezzo']),
            'distance' => round(floatval($row['distance']), 2),
            'latitudine' => floatval($row['latitudine']),
            'longitudine' => floatval($row['longitudine'])
        ];
    }

    $response = [
        'debug_query' => $sql,
        'lat' => $lat,
        'lon' => $lon,
        'max' => $maxDistanza,
        'count' => count($menu),
        'results' => $menu
    ];

    ob_end_clean();
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} else {
	ob_end_clean();
    echo json_encode(['message' => 'Abbiamo records ma fetch_assoc non restituisce nulla', 'query' => $sql]);
}

$conn->close();
