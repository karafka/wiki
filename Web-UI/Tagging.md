# Web UI Tagging API Support

Karafka Web supports process and consumer tagging.

Tags can be used to add additional information about consumers and their execution and Karafka processes themselves.

Tags are a helpful feature that can help you add additional context about your Karafka application, making monitoring and analyzing Karafka operations easier.

Tags can be added, removed, and updated during the runtime, and their changes will be reflected in the Web UI.

You can attach as many tags as you want, and they can also include emoji characters:

```ruby
# Use emoji to indicate easily whether it is a "powerful" machine or not
machine_type = Etc.nprocessors > 16 ? '💪' : '🪶'
Karafka::Process.tags.add(:machine_type, machine_type)
```

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/tags-emoji.png" alt="karafka web emoji tagging presentation" />
</p>

## Taggable resources

At the moment Karafka supports tagging the `Karafka::Process` itself and consumers instances.

## Tagging API

Karafka tagging API is based on `Karafka::Core::Taggable` interface.

Tags can be added, updated, and removed from resources that support tagging.

This allows you not only to attach tags but also to change them during runtime.

Each tag consists of a name and a value. Names are used to identify tags in case you would want to update or remove them, and they are **not** displayed.

### Adding a tag

To tag a resource, you must fetch the `Karafka::Core::Taggable::Tags` object using the `#tags` method and invoke the `#add` method on it.

`#add` method accepts two arguments:

1. `name` - string or a symbol that uniquely identifies the tag.
2. `value` - tag value that you want to display in the Web UI.

```ruby
# Add a tag to the Karafka::Process

Karafka::Process.tags.add(:tag_example, 'MySuperTag!')
```

Since tags names are not displayed, in case you would want to add a tag that contains a name, you can just include the name itself in the tag value:

```ruby
# Add commit hash into process tag with a label
tag_name = 'git_hash'
tag_value = `git rev-parse --short HEAD`.strip
Karafka::Process.tags.add(tag_name, "#{tag_name}:##{tag_value}")
```

### Deleting a tag

To delete a tag, use the `#delete` method, providing the name of the tag you want to remove:

```ruby
# Remove a tag named `tag_example`
Karafka::Process.tags.delete(:tag_example)
```

### Updating a tag

To update a tag, use `#add` with the same key as previously, and the value will be overwritten:

```ruby
Karafka::Process.tags.add(:tag_example, 'MySuperTag!')
Karafka::Process.tags.add(:tag_example, 'MyBetterSuperTag!')
```

## Managing per-process tags

You can manage tags for every Karafka process you start. To do so, just reference `#tags` on a `Karafka::Process` level:

```ruby
# Add
Karafka::Process.tags.add(:my_tag, 'MyAwesomTag')
# And update
Karafka::Process.tags.add(:my_tag, 'MySuperTag!')
```

Process tags will be visible in the following places:

In the consumers' main view for each process:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/tags-process1.png" alt="karafka web tagging presentation" />
</p>

In the consumer detailed view (Karafka Pro only):

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/tags-process2.png" alt="karafka web tagging presentation" />
</p>

## Managing consumer work-related tags

Karafka allows you also to tag your running consumers. You can use consumers tags for many things like:

- indicating various stages of the processing
- indicating types of work that is happening
- reporting the current state of a long-living buffer

For example, assume you have a pipeline-like processing flow where you validate, store, and dispatch messages. You can keep track of the state in those jobs in real time by tagging each of the stages:

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    payloads = messages.payloads

    tags.add(:stage, 'stage:validating')
    payloads.each { |payload| EventsValidator.validate!(payload) }

    tags.add(:stage, 'stage:storing')
    Event.insert_all payloads

    tags.add(:stage, 'stage:dispatching')
    payloads.each { |payload| TrackDispatcher.dispatch(payload) }
  end
end
```

Consumer tags will be visible in the following places:

In the jobs overview page:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/tags-job1.png" alt="karafka web tagging presentation" />
</p>

In the consumer jobs detailed view (Karafka Pro only):

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/tags-job2.png" alt="karafka web tagging presentation" />
</p>
