# WEBrick 1.9.2 treats a matching If-Range validator as a cache hit (304).
# Video players need the requested bytes (206), often to read trailing MP4 metadata.
# This changes only the development server; it does not alter generated site files.
# Upstream implementation: ruby/webrick lib/webrick/httpservlet/filehandler.rb.
require "webrick"

module AcademicSiteVideoRanges
  def do_GET(request, response)
    return super unless request["range"] && request["if-range"]

    original_validator = request.header.delete("if-range")
    original_range = request.header["range"]
    stat = File.stat(@local_path)
    etag = format("%x-%x-%x", stat.ino, stat.size, stat.mtime.to_i)
    validator = original_validator.first
    matches = validator == etag
    unless matches
      begin
        matches = Time.httpdate(validator).to_i == stat.mtime.to_i
      rescue ArgumentError
        matches = false
      end
    end
    # A stale validator requires the entire current file, rather than a partial body.
    request.header.delete("range") unless matches
    super
  ensure
    if original_validator
      request.header["if-range"] = original_validator
      request.header["range"] = original_range
    end
  end
end

unless WEBrick::HTTPServlet::DefaultFileHandler.ancestors.include?(AcademicSiteVideoRanges)
  WEBrick::HTTPServlet::DefaultFileHandler.prepend(AcademicSiteVideoRanges)
end
