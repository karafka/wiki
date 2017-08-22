Karafka by default will parse messages with a JSON parser. If you want to change this behaviour you need to set a custom parser for each route. Parser needs to have a following class methods:

  - ```#parse``` - method used to parse incoming string into an object/hash
  - ```#generate``` - method used in responders in order to convert objects into strings that have desired format

and raise an error that is a ::Karafka::Errors::ParserError descendant when problem appears during the parsing process.

```ruby
class XmlParser
  class ParserError < ::Karafka::Errors::ParserError; end

  def self.parse(message)
    Hash.from_xml(message)
  rescue REXML::ParseException
    raise ParserError
  end

  def self.generate(object)
    object.to_xml
  end
end

App.routes.draw do
  topic :binary_video_details do
    controller Videos::DetailsController
    parser XmlParser
  end
end
```

Note that parsing failure won't stop the application flow. Instead, Karafka will assign the raw message inside the :message key of params. That way you can handle raw message inside the Sidekiq worker (you can implement error detection, etc. - any "heavy" parsing logic can and should be implemented there).