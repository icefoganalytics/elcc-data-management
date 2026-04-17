#!/usr/bin/env ruby

require "fileutils"
require "json"
require "rbconfig"
require "shellwords"
require "socket"
require "uri"

class OpenInEditorBridge
  DEFAULT_PORT = "3333"
  HEALTH_PATH = "/health"
  OPEN_IN_EDITOR_PATH = "/__open-in-editor"
  RESPONSE_PHRASES = {
    200 => "OK",
    400 => "Bad Request",
    404 => "Not Found",
    405 => "Method Not Allowed",
    500 => "Internal Server Error"
  }.freeze

  PORT = ENV.fetch("OPEN_IN_EDITOR_BRIDGE_PORT", DEFAULT_PORT).to_i
  PROJECT_ROOT = File.expand_path("..", __dir__)
  PID_FILE = File.join(PROJECT_ROOT, "tmp", "open-in-editor-bridge.pid")
  LOG_FILE = File.join(PROJECT_ROOT, "tmp", "open-in-editor-bridge.log")
  CONTAINER_WEB_ROOT =
    ENV.fetch("OPEN_IN_EDITOR_CONTAINER_WEB_ROOT", "/usr/src/web")
  HOST_WEB_ROOT =
    ENV.fetch("OPEN_IN_EDITOR_HOST_WEB_ROOT", File.join(PROJECT_ROOT, "web"))
  EDITOR_COMMAND =
    ENV.fetch("OPEN_IN_EDITOR_COMMAND", ENV.fetch("EDITOR", "windsurf"))

  def self.call(*args)
    new.call(*args)
  end

  def self.with_running(ensure_running: true)
    call("--ensure-running") if ensure_running

    begin
      yield
    ensure
      call("--shutdown")
    end
  end

  def call(*args)
    command = args.first || "--serve"

    case command
    when "--ensure-running"
      ensure_running
    when "--shutdown"
      shutdown
    when "--serve"
      serve
    else
      serve
    end
  end

  private

  def ensure_running
    pid = running_pid
    if pid
      return puts("Editor bridge already running on port #{PORT} (pid #{pid}).")
    end

    ensure_runtime_directory
    pid =
      Process.spawn(
        *server_process_command,
        out: LOG_FILE,
        err: LOG_FILE,
        pgroup: true
      )
    Process.detach(pid)

    sleep(0.2)

    if process_running?(pid)
      write_pid_file(pid)
      puts "Started editor bridge on port #{PORT}."
    else
      warn "Failed to start editor bridge. See #{LOG_FILE}."
    end
  end

  def shutdown
    pid = running_pid

    return unless pid

    Process.kill("TERM", -pid)
    delete_pid_file

    puts "Stopped editor bridge."
  rescue Errno::ESRCH
    delete_pid_file
  end

  def serve
    ensure_runtime_directory
    write_pid_file(Process.pid)

    @server = TCPServer.new("0.0.0.0", PORT)
    @running = true

    install_signal_handlers

    while @running
      begin
        socket = @server.accept
        handle_request(socket)
      rescue IOError, Errno::EBADF
        break
      end
    end
  ensure
    @server&.close
    delete_pid_file
  end

  def handle_request(socket)
    request = read_request(socket)
    return if request.nil?

    method = request.fetch(:method)
    consume_headers(socket)

    unless method == "GET"
      return(
        write_json_response(
          socket,
          status: 405,
          payload: {
            error: "Method not allowed"
          }
        )
      )
    end

    path = request.fetch(:path)
    params = request.fetch(:params)
    respond_to_get_request(socket, path, params)
  ensure
    socket.close unless socket.closed?
  end

  def consume_headers(socket)
    loop do
      line = socket.gets
      break if line.nil? || line == "\r\n"
    end
  end

  def open_in_editor(socket, params)
    file = params["file"]

    if file.nil? || file.empty?
      return(
        write_json_response(
          socket,
          status: 400,
          payload: {
            error: "Missing required query parameter: file"
          }
        )
      )
    end

    translated_target = translate_target(file)

    write_json_response(
      socket,
      status: 200,
      payload: {
        ok: true,
        requestedFile: file,
        translatedTarget: translated_target,
        editorCommand: EDITOR_COMMAND
      }
    )

    pid = Process.spawn(*editor_command_args, "--goto", translated_target)
    Process.detach(pid)
  end

  def write_json_response(socket, status: 200, payload:)
    body = JSON.generate(payload)
    reason_phrase = RESPONSE_PHRASES.fetch(status)

    socket.write("HTTP/1.1 #{status} #{reason_phrase}\r\n")
    socket.write("Content-Type: application/json\r\n")
    socket.write("Access-Control-Allow-Origin: *\r\n")
    socket.write("Content-Length: #{body.bytesize}\r\n")
    socket.write("Connection: close\r\n")
    socket.write("\r\n")
    socket.write(body)
  end

  def stop_server
    @running = false
    @server&.close
  end

  def ensure_runtime_directory
    FileUtils.mkdir_p(File.dirname(PID_FILE))
  end

  def write_pid_file(pid)
    File.write(PID_FILE, "#{pid}\n")
  end

  def delete_pid_file
    File.delete(PID_FILE) if File.exist?(PID_FILE)
  end

  def server_process_command
    [RbConfig.ruby, __FILE__, "--serve"]
  end

  def editor_command_args
    Shellwords.split(EDITOR_COMMAND)
  end

  def install_signal_handlers
    trap("INT") { stop_server }
    trap("TERM") { stop_server }
  end

  def read_request(socket)
    request_line = socket.gets
    return nil if request_line.nil?

    method, raw_target, = request_line.split(" ")
    path, query = raw_target.split("?", 2)
    params = URI.decode_www_form(query.to_s).to_h

    { method: method, path: path, params: params }
  end

  def respond_to_get_request(socket, path, params)
    case path
    when HEALTH_PATH
      write_json_response(socket, payload: { ok: true })
    when OPEN_IN_EDITOR_PATH
      open_in_editor(socket, params)
    else
      write_json_response(socket, status: 404, payload: { error: "Not found" })
    end
  end

  def translate_target(target)
    path, location = split_target(target)
    translated_path =
      path.sub(/\A#{Regexp.escape(CONTAINER_WEB_ROOT)}/, HOST_WEB_ROOT)

    return translated_path if location.nil?

    "#{translated_path}:#{location}"
  end

  def split_target(target)
    decoded_target = URI.decode_www_form_component(target)
    match = decoded_target.match(/\A(.+?):(\d+)(?::(\d+))?\z/)

    return decoded_target, nil if match.nil?

    path = match[1]
    line = match[2]
    column = match[3]
    location = [line, column].compact.join(":")

    [path, location]
  end

  def running_pid
    return nil unless File.exist?(PID_FILE)

    pid = Integer(File.read(PID_FILE).strip)
    return pid if process_running?(pid)

    delete_pid_file
    nil
  rescue ArgumentError
    delete_pid_file
    nil
  end

  def process_running?(pid)
    Process.kill(0, pid)
    true
  rescue Errno::ESRCH, Errno::EPERM
    false
  end
end

OpenInEditorBridge.call(*ARGV) if $PROGRAM_NAME == __FILE__
