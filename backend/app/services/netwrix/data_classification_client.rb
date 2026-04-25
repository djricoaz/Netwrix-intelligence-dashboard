module Netwrix
  class DataClassificationClient
    BASE_URL = ENV["NDC_BASE_URL"]

    def initialize
      @conn = Faraday.new(url: BASE_URL, ssl: { verify: false }) do |f|
        f.request :url_encoded
        f.response :logger if Rails.env.development?
        f.adapter Faraday.default_adapter
        f.headers["Content-Type"] = "text/xml; charset=utf-8"
      end
      @auth = { username: ENV["NDC_USERNAME"], password: ENV["NDC_PASSWORD"] }
    end

    # Returns classified items with sensitive data tags
    def sensitive_items(path: nil, classification: nil, limit: 500)
      response = @conn.post("/QueryServer.asmx", build_query_xml(path: path, classification: classification, limit: limit)) do |req|
        req.headers["SOAPAction"] = "\"GetClassifiedItems\""
      end
      parse_xml_response(response.body)
    end

    # Returns all shares with their risk/classification summary
    def shares_summary
      response = @conn.post("/QueryServer.asmx", build_shares_xml) do |req|
        req.headers["SOAPAction"] = "\"GetSharesSummary\""
      end
      parse_xml_response(response.body)
    end

    # Returns classification taxonomy (tag types)
    def classifications
      response = @conn.post("/QueryServer.asmx", build_classifications_xml) do |req|
        req.headers["SOAPAction"] = "\"GetClassifications\""
      end
      parse_xml_response(response.body)
    end

    private

    def build_query_xml(path: nil, classification: nil, limit: 500)
      <<~XML
        <?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Header>
            <AuthHeader xmlns="http://www.conceptsearching.com/">
              <Username>#{@auth[:username]}</Username>
              <Password>#{@auth[:password]}</Password>
            </AuthHeader>
          </soap:Header>
          <soap:Body>
            <GetClassifiedItems xmlns="http://www.conceptsearching.com/">
              <path>#{path || ""}</path>
              <classification>#{classification || ""}</classification>
              <maxResults>#{limit}</maxResults>
            </GetClassifiedItems>
          </soap:Body>
        </soap:Envelope>
      XML
    end

    def build_shares_xml
      <<~XML
        <?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Header>
            <AuthHeader xmlns="http://www.conceptsearching.com/">
              <Username>#{@auth[:username]}</Username>
              <Password>#{@auth[:password]}</Password>
            </AuthHeader>
          </soap:Header>
          <soap:Body>
            <GetSharesSummary xmlns="http://www.conceptsearching.com/" />
          </soap:Body>
        </soap:Envelope>
      XML
    end

    def build_classifications_xml
      <<~XML
        <?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Header>
            <AuthHeader xmlns="http://www.conceptsearching.com/">
              <Username>#{@auth[:username]}</Username>
              <Password>#{@auth[:password]}</Password>
            </AuthHeader>
          </soap:Header>
          <soap:Body>
            <GetClassifications xmlns="http://www.conceptsearching.com/" />
          </soap:Body>
        </soap:Envelope>
      XML
    end

    def parse_xml_response(xml_body)
      doc = Nokogiri::XML(xml_body)
      doc.remove_namespaces!
      items = doc.xpath("//item").map do |node|
        node.element_children.each_with_object({}) do |child, hash|
          hash[child.name.underscore] = child.text
        end
      end
      items
    end
  end
end
