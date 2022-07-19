To activate your Karafka Pro subscription you need to do two things:

1. First add your license token in your `karafka.rb` file:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other config options

    config.license.token = <<~TOKEN
      i6OS4XMugYjTxPUm4IIjyejEhQXnS/tzz4eSRThV1ebEYLbA6Y1x53XXsbRG
      Zx+DhTdosjH3RFmuy1J9LKVlYBa2WX9QGk6SGxVCCMiLUESnAj0VawsT20o/
      0Z22EFGkgoz9E/t1XdFAmCwYJOrns5tVtFjXIaCnSEaDnweCxLGDrk6fVYfB
      fkemJzii64BwyPlEqehIsbcH0F5rdiTonDJPtIwu36S1nuHCU/C269RQeyMc
      6UQ0n+8YfYJu8QIb5R0rnRiZQwF1jdW8IfjLRuLKi+7HQiNMjbcKoQohufsX
      xhiRyMJjMtRQpkKsFR1wrSaVXVpKMklfagXuwGioqhuy0lzWdAhNg/Vb4asG
      7FP2WbbcKJ44r36LJrHEIX4t1nuy9/Ee8RxTPxFPbEiaauDuSO4Ytzi9OkAC
      pW5tWnTrG9b1ARoS3u6hDo+OmK2t4dmk1x9RolAMUex1lwfP4Jyjj9Ff8a8U
      151nzgnqP3S4mq5zgY7lduowAUaw+wZ6
    TOKEN
  end
end
```

2. Then, instead of inheriting from `Karafka::BaseConsumer`, your `ApplicationConsumer` should inherit from the `Karafka::Pro::BaseConsumer`:

```ruby
# Replace this:
# class ApplicationConsumer < Karafka::BaseConsumer

# With this
class ApplicationConsumer < Karafka::Pro::BaseConsumer
end
```

That is all. You are now consuming messages like a Pro and can use all of the Pro features!
