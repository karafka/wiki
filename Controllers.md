Controllers should inherit from the **ApplicationController** (or any other controller that inherits from **Karafka::BaseController**). You need to define a ```#consume``` method that will execute your business logic code.

```ruby
class UsersController < ApplicationController
  def consume
    # business logic goes here
  end
end
```

## Controller topic method

If for any case, your logic is dependent on some routing details, you can access them from the controller using the ```#topic``` method. You could use it for example, in case you want to perform a different logic within a single controller, based on the topic from which your messages come:

```ruby
class UsersController < ApplicationController
  def consume
    send(:"topic_#{topic.name}")
  end

  def topic_a
    # do something
  end

  def topic_b
    # do something else if it's a "b" topic
  end
end
```

If you're interested in all the details that are stored in the topic, you can extract all of them at once, by using the ```#to_h``` method:

```ruby
class UsersController < ApplicationController
  def consume
    puts topic.to_h #=> { backend: :inline, name: 'x', ... }
  end
end
```
