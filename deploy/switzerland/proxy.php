<?php
// Same-origin API bridge on shared hosting; fixed upstream, never an open proxy.
declare(strict_types=1);
$uri = $_SERVER['REQUEST_URI'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!preg_match('~^/Switzerland/api(?:/|\?|$)~', $uri) || preg_match('/[\r\n]/', $uri) || !in_array($method, ['GET','POST','DELETE'], true)) {
    http_response_code(404); exit;
}
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 16384) { http_response_code(413); exit; }
$input = file_get_contents('php://input', false, null, 0, 16385);
if (strlen($input) > 16384) { http_response_code(413); exit; }
$headers = ['Accept: application/json'];
foreach (['CONTENT_TYPE'=>'Content-Type','HTTP_ORIGIN'=>'Origin','HTTP_COOKIE'=>'Cookie'] as $key=>$name) {
    if (isset($_SERVER[$key]) && !preg_match('/[\r\n]/', $_SERVER[$key])) $headers[]=$name.': '.$_SERVER[$key];
}
$ch = curl_init('https://cico.cardanoschool.org'.$uri);
curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST=>$method, CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>$headers,
    CURLOPT_FOLLOWLOCATION=>false, CURLOPT_CONNECTTIMEOUT=>10, CURLOPT_TIMEOUT=>110,
    CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS, CURLOPT_SSL_VERIFYPEER=>true, CURLOPT_SSL_VERIFYHOST=>2,
    CURLOPT_HEADERFUNCTION=>static function($ch,$line) {
        if (preg_match('/^(Content-Type|Set-Cookie|Location):/i',$line)) header(trim($line),false);
        return strlen($line);
    }]);
if ($method !== 'GET') curl_setopt($ch,CURLOPT_POSTFIELDS,$input);
$body=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);
if ($body === false || $status < 100) {http_response_code(502);header('Content-Type: application/json');echo '{"error":"SWISS_BACKEND_UNAVAILABLE"}';exit;}
http_response_code($status);echo $body;
