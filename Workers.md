**Note**: You can use Karafka __without__ Sidekiq as well. In cases like that, you don't need workers at all.

Karafka by default will build a worker that will correspond to each of your controllers (so you will have a pair - controller and a worker). All of them will inherit from **ApplicationWorker** and will share all its settings.

To run Sidekiq you should have sidekiq.yml file in *config* folder. The example of ```sidekiq.yml``` file will be generated to config/sidekiq.yml.example once you run ```bundle exec karafka install```.

However, if you want to use a raw Sidekiq worker (without any Karafka additional magic), or you want to use SidekiqPro (or any other queuing engine that has the same API as Sidekiq), you can assign your own custom worker:

```ruby
topic :incoming_messages do
  controller MessagesController
  worker MyCustomWorker
end
```

Note that even then, you need to specify a controller that will schedule a background task.

Custom workers need to provide a ```#perform_async``` method. It needs to accept two arguments:

 - ```topic``` - first argument is a current topic from which a given message comes
 - ```params``` - all the params that came from Kafka + additional metadata. This data format might be changed if you use custom interchangers. Otherwise it will be an instance of Karafka::Params::Params.

Keep in mind, that params might be in two states: parsed or unparsed when passed to #perform_async. This means, that if you use custom interchangers and/or custom workers, you might want to look into Karafka's sources to see exactly how it works.