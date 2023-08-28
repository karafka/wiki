Cleaner API is a feature designed to enhance the performance and efficiency of batch-processing tasks by promptly freeing up memory once a message payload is no longer needed. By addressing potential memory spikes, the Cleaner API ensures a more stable and efficient processing environment, especially beneficial when handling payloads of size 10KB and larger.

## How does it work

This functionality extends both the message batch and individual message objects. Messages can indicate when their payload is no longer necessary. Once a message conveys this information, the Cleaner API completely removes both the payload and the raw payload from memory. 

Remarkably, this memory clearance occurs before the entire batch is processed, effectively allowing only a single deserialized payload to be kept in memory. This mechanism is particularly advantageous when sequentially processing messages, especially within large batches containing hundreds of messages or more. This ensures optimal memory management and faster processing, as no longer needed data is eradicated immediately after processing, rather than waiting for the entire batch to conclude.

The below example illustrates how the Cleaner API releases both `payload` and `raw_payload` after each of the processed messages.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/cleaner_api/flow.svg" />
</p>

**Note**: The data stored in Kafka remains unaltered and intact, regardless of any actions taken using the Cleaner API. The Cleaner API is exclusively designed to manage and optimize the memory utilization of the running process. When the API removes a message's payload, it only clears that data from the application's active memory. This operation does not, in any manner, affect the original message data residing in Kafka.

## Using Cleaner API

When utilizing the Cleaner API, it is paramount to understand the implications on the message's data.

Once `#clean!` is invoked on a message, the message's `payload` and `raw_payload` are permanently removed from memory. As a result, these data become irretrievable and inaccessible. Please ensure that, under any circumstances, you do not try to use this data after it has been cleaned.

### Cleaning one message at a time

After processing a message, you can explicitly call the #clean! method on that message. This allows you to have granular control over which messages are cleaned from memory.

```ruby
def consume
  messages.each do |message|
    DataStore.persist!(message.payload)

    mark_as_consumed(message)

    message.clean!
  end
end
```

### Automatic Cleaning with `#each`

The Cleaner API allows you to automate the cleanup process for a more streamlined approach. By providing the `clean: true` parameter to the `#each` method, each message's payload is automatically cleaned from memory as soon as it's processed.

```ruby
def consume
  # Clean each message after we're done processing it
  messages.each(clean: true) do |message|
    DataStore.persist!(message.payload)

    mark_as_consumed(message)
  end
end
```

## Benefits

- **Memory Efficiency**: Cleaner API optimizes memory usage by promptly releasing unused messages payloads, ensuring that your application uses memory judiciously.

- **Performance Boost**: By avoiding significant memory spikes and congestion, applications can run smoother and process batches faster.

- **Cost Savings**: Efficient memory use can directly influence hosting costs, especially in cloud environments where you pay for the resources you use.

- **Enhanced Reliability**: By proactively managing memory, the chances of application crashes due to out-of-memory exceptions become much lower.

## Statistics

The efficacy and benefits of the Cleaner API are closely linked to the sizes of the raw payload and the deserialized payload of messages. 

The magnitude of memory management gains directly correlates with the average size of these payloads and the number of messages obtained in a single batch.

In scenarios where the raw payload of a message is under 1KB, the advantages derived from using the Cleaner API tend to be minimal and may even appear negligible. This is because the memory space occupied by smaller messages is relatively minor. However, as the size of messages increases, the benefits of using the Cleaner API become increasingly pronounced. Large messages, when retained in memory after processing, can lead to significant memory congestion, and clearing them out promptly can free up sizable memory chunks, enhancing overall system performance.

This size dependency is precisely why the statistics below offer insights into multiple scenarios, capturing the varying benefits across different payload sizes.

The examples provided here illustrate the memory management across three styles of processing:

1. **Standard**: In this approach, the processing loop deserializes one message at a time, making it a sequential and straightforward method.

2. **Immediate**: This method first invokes the `#payloads` function, deserializing all messages before any further processing occurs. This pre-deserialization can influence the overall memory consumption as all messages get loaded into memory up front.

3. **Cleaned**: This processing style uses the `#each` loop but with an added parameter `cleaned: true`. This ensures that after each message is processed, its payload is promptly cleaned from memory, thus potentially reducing memory spikes and promoting efficient memory use.

For these examples, the primary metric used to measure memory consumption is RSS or Resident Set Size. RSS represents the portion of a process's memory that is held in RAM. This measurement clearly indicates the actual memory footprint of the process during its execution. In the context of these examples, the RSS value is displayed in megabytes (MBs).

The structure of the code primarily focuses on deserializing data and then waiting and was similar to the one below:

```ruby
def consume
  # messages.payloads
  messages.each(clean: true) do |message|
    message.payload
    sleep(0.1)
  end
end
```

Each fetched batch contained at most 500 messages.

### Message size of 1MB

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/cleaner_api/1mb_memory.png" />
</p>

### Message size of 100KB

TBA

### Message size of 10KB

TBA

### Message size of 1KB

TBA

## Limitations

TBA

## Example use-cases

TBA
