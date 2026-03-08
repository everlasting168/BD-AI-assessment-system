<?php
declare(strict_types=1);

// Simple server-side export: accepts JSON in POST body and returns HTML file.
// Note: You should protect this endpoint (auth) if used internally.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  exit('POST only');
}

$raw = file_get_contents('php://input');
if (!$raw) { http_response_code(400); exit('Missing body'); }

$data = json_decode($raw, true);
if (!is_array($data)) { http_response_code(400); exit('Invalid JSON'); }

$asset = $data['Asset'] ?? $data;
$title = htmlspecialchars(($asset['Name'] ?? 'Report') . ' (Export)');

header('Content-Type: text/html; charset=utf-8');
header('Content-Disposition: attachment; filename="report_export.html"');

echo "<!doctype html><html><head><meta charset='utf-8'><title>{$title}</title></head><body>";
echo "<h1>{$title}</h1>";
echo "<pre>" . htmlspecialchars(json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE)) . "</pre>";
echo "</body></html>";