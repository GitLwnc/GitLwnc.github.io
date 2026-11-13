require "yaml"
require "json"
require "date"

records = Dir["_publications/*.md"].map do |path|
  metadata = YAML.safe_load(File.read(path).split(/^---\s*$\n?/, 3)[1], permitted_classes: [Date, Time], aliases: true)
  raise "Missing publication ID: #{path}" unless metadata["record_id"]
  raise "Unknown publication status: #{path}" unless %w[published submitted in_preparation].include?(metadata["status"])
  if metadata["status"] == "published"
    %w[authors year title venue volume doi display_order permalink].each do |field|
      raise "Missing #{field}: #{path}" if metadata[field].nil? || metadata[field].to_s.empty?
    end
    raise "Invalid DOI: #{path}" unless metadata["doi"].match?(%r{\A10\.\d{4,9}/\S+\z})
    raise "Missing pagination explanation: #{path}" unless metadata["pages"] || metadata["article_number"] || metadata["metadata_note"]
  else
    %w[doi paperurl year venue volume issue pages article_number].each do |field|
      raise "Unpublished manuscript has publication field #{field}: #{path}" if metadata[field]
    end
    raise "Preparation manuscript must not invent authors" if metadata["status"] == "in_preparation" && metadata["authors"]
  end
  metadata
end
raise "Duplicate publication IDs" unless records.map { |r| r["record_id"] }.uniq.length == records.length
dois = records.filter_map { |r| r["doi"] }
raise "Duplicate DOIs" unless dois.uniq.length == dois.length
required_dois = %w[10.1016/j.trgeo.2026.102417 10.1139/cgj-2026-0045 10.1680/jgeot.25.00080 10.1103/PhysRevE.111.L053501 10.1139/cgj-2023-0638]
raise "Missing confirmed published paper" unless (required_dois - dois).empty?
puts JSON.generate(records)
