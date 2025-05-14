<?php
// ===========================
// CONFIGURATION
// ===========================

$API_KEY = 'D5850UGNHB3RY6Z16SIGQCDDQGFQ398F'; // 🔒 À personnaliser
$UPLOAD_DIR = __DIR__ . '/zip-downloads/'; // Dossier cible (doit être accessible en écriture)
$PUBLIC_URL_BASE = 'https://www.stimergie.fr/zip-downloads/'; // URL publique de base


// ===========================
// 1. Authentification
// ===========================
$headers = getallheaders();
if (!isset($headers['Authorization']) || $headers['Authorization'] !== 'Bearer ' . $API_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// ===========================
// 2. Vérification et traitement du fichier
// ===========================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Aucun fichier reçu']);
    exit;
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur lors du téléchargement du fichier']);
    exit;
}

// Sécurisation du nom de fichier
$filename = basename($file['name']);
$filename = preg_replace('/[^a-zA-Z0-9_\-.]/', '_', $filename);

// Génération d'un nom unique pour éviter les conflits
$uniqueName = time() . '_' . $filename;

// Vérifie l'extension .zip
if (strtolower(pathinfo($uniqueName, PATHINFO_EXTENSION)) !== 'zip') {
    http_response_code(400);
    echo json_encode(['error' => 'Seuls les fichiers ZIP sont autorisés']);
    exit;
}

// S'assure que le dossier existe
if (!is_dir($UPLOAD_DIR)) {
    mkdir($UPLOAD_DIR, 0755, true);
}

// Déplacement du fichier
$destination = $UPLOAD_DIR . $uniqueName;
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    echo json_encode(['error' => 'Impossible de sauvegarder le fichier']);
    exit;
}

// ===========================
// 3. Réponse OK
// ===========================
http_response_code(200);
echo json_encode([
    'message' => 'Fichier téléchargé avec succès',
    'filename' => $uniqueName,
    'url' => $PUBLIC_URL_BASE . $uniqueName
]);
