require 'net/http'
require 'json'
require 'uri'

require_relative "./prose_mirror_to_json.rb"

class JiraApi
  JIRA_EMAIL = ENV['JIRA_EMAIL']
  JIRA_API_TOKEN = ENV['JIRA_API_TOKEN']
  JIRA_SITE = 'https://yg-hpw.atlassian.net'

  def self.build_branch_name(jira_ticket_url)
    if JIRA_EMAIL.nil? || JIRA_API_TOKEN.nil?
      puts 'Please set JIRA_EMAIL and JIRA_API_TOKEN environment variables'
      return
    end

    issue_key = extract_issue_key(jira_ticket_url)
    issue_data = fetch_issue_data(issue_key)

    if issue_data.nil?
      puts "Failed to fetch issue data for #{issue_key}"
      return
    end

    issue_title = extract_issue_title(issue_data)

    if issue_title.nil?
      puts "Failed to extract issue title from response"
      return
    end

    format_branch_name(issue_key, issue_title)
  end

  def self.fetch_description_as_markdown(jira_ticket_url)
    if JIRA_EMAIL.nil? || JIRA_API_TOKEN.nil?
      puts 'Please set JIRA_EMAIL and JIRA_API_TOKEN environment variables'
      return
    end

    issue_key = extract_issue_key(jira_ticket_url)
    issue_data = fetch_issue_data(issue_key)

    if issue_data.nil?
      puts "Failed to fetch issue data for #{issue_key}"
      return
    end

    issue_description = extract_issue_description(issue_data)

    if issue_description.nil?
      puts "Failed to extract issue description from response"
      return
    end

    prose_mirror_to_markdown(issue_description)
  end

  private

  def self.extract_issue_key(url)
    url.match(%r{/browse/([A-Z]+-\d+)})[1]
  end

  def self.fetch_issue_data(issue_key)
    uri = URI("#{JIRA_SITE}/rest/api/3/issue/#{issue_key}")
    request = Net::HTTP::Get.new(uri)
    request.basic_auth(JIRA_EMAIL, JIRA_API_TOKEN)

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end

    unless response.is_a?(Net::HTTPSuccess)
      puts "Jira API Error: #{response.code} - #{response.message}"
      puts "Response body: #{response.body}"
      return nil
    end

    JSON.parse(response.body)
  rescue JSON::ParserError => e
    puts "JSON parsing error: #{e.message}"
    puts "Response body: #{response.body}"
    nil
  end

  def self.extract_issue_title(issue_data)
    return nil if issue_data.nil?

    issue_data['fields']['summary']
  end

  def self.extract_issue_description(issue_data)
    return nil if issue_data.nil?

    issue_data['fields']['description']
  end

  def self.format_branch_name(issue_key, issue_title)
    formatted_title = issue_title.downcase.gsub(/\s+/, '-').gsub(/[^a-z0-9\-]/, '')
    "#{issue_key.downcase}/#{formatted_title}"
  end

  def self.prose_mirror_to_markdown(description)
    ProseMirrorToMarkdown.call(description)
  end
end
