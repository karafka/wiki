Karafka by default makes two assumptions about incoming data:

- your incoming message is a JSON based one.
- it contains a hash with attributes (not an array or a string).

This means, that if you send for example a JSON array, it cannot be directly merged into the ```#params``` and you might encounter following error message:

```
NoMethodError: undefined method `to_hash` for #<Array:0x007fb1eaafeee0>
```

If you want to fix that or if you want to change the way data is being merged with params, you need to set a custom parser for each route. The parser needs to have a following class methods:

  - ```#parse``` - a method used to parse an incoming string into an object/hash
  - ```#generate``` - a method used in responders in order to convert objects into strings that have desired format

and raise an error that is a ::Karafka::Errors::ParserError descendant when the problem appears during the parsing process.

```ruby
class XmlParser
  ParserError = Class.new(::Karafka::Errors::ParserError)

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
    consumer Videos::DetailsConsumer
    parser XmlParser
  end
end
```

If you want to change general Karafka parsing behavior, you can do that by assigning parser during the framework configuration:

```ruby
class App < Karafka::App
  setup do |config|
    # Other options here...
    config.parser = MyCustomParser
  end
end
```