import SimpleHTTPServer,SocketServer
H = SimpleHTTPServer.SimpleHTTPRequestHandler
d = SocketServer.TCPServer(("", 8011), H)
d.serve_forever()
