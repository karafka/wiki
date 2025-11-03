# Kafka Topic Configuration

!!! tip "Kafka Configuration Variability"

    The defaults and exact list of per-topic configuration options may differ between various Kafka versions. For the most accurate information, please refer to the documentation for the specific Kafka version.

<style>
  .md-grid {
    max-width: 100%;
  }

  #configs-table tr td {
    vertical-align: middle !important;
  }

  #configs-table tr td.middle {
    text-align: center !important;
  }
</style>

<table border='1' id="configs-table">

  <tr>
    <th>Names</th>
    <th>Default Value</th>
    <th>Read-Only</th>
    <th>Sensitive</th>
    <th>Description</th>
  </tr>

<tr>
<td class="nowrap"><code>cleanup.policy</code><br/>
<code>log.cleanup.policy</code></td>
<td class="nowrap"><code>delete</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The policy to use for log cleanup. The default is 'delete' which removes old log segments. 'compact' is for log compaction.</td>
</tr>
<tr>
<td class="nowrap"><code>compression.type</code></td>
<td class="nowrap"><code>producer</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>Specify the final compression type for a given topic. Valid values are 'uncompressed', 'zstd', 'lz4', 'gzip', and 'snappy'.</td>
</tr>
<tr>
<td class="nowrap"><code>delete.retention.ms</code><br/>
<code>log.cleaner.delete.retention.ms</code></td>
<td class="nowrap"><code>86400000</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The amount of time to retain delete markers in log compacted topics. This is also the time to retain tombstone messages in topics without log compaction.</td>
</tr>
<tr>
<td class="nowrap"><code>file.delete.delay.ms</code><br/>
<code>log.segment.delete.delay.ms</code></td>
<td class="nowrap"><code>60000</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The time to wait before deleting a file from the filesystem.</td>
</tr>
<tr>
<td class="nowrap"><code>flush.messages</code><br/>
<code>log.flush.interval.messages</code></td>
<td class="nowrap"><code>9223372036854775807</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The number of messages to accept before forcing a flush of data to disk.</td>
</tr>
<tr>
<td class="nowrap"><code>flush.ms</code></td>
<td class="nowrap"><code>9223372036854775807</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum time in milliseconds to wait before forcing a flush of data to disk.</td>
</tr>
<tr>
<td class="nowrap"><code>follower.replication.throttled.replicas</code></td>
<td class="nowrap"><code></code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>A list of replica IDs that will be throttled on replication.</td>
</tr>
<tr>
<td class="nowrap"><code>index.interval.bytes</code><br/>
<code>log.index.interval.bytes</code></td>
<td class="nowrap"><code>4096</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The interval with which Kafka adds an entry to the offset index.</td>
</tr>
<tr>
<td class="nowrap"><code>leader.replication.throttled.replicas</code></td>
<td class="nowrap"><code></code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>A list of replica IDs that will be throttled on replication.</td>
</tr>
<tr>
<td class="nowrap"><code>local.retention.bytes</code><br/>
<code>log.local.retention.bytes</code></td>
<td class="nowrap"><code>-2</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum size of the log before deleting it.</td>
</tr>
<tr>
<td class="nowrap"><code>local.retention.ms</code><br/>
<code>log.local.retention.ms</code></td>
<td class="nowrap"><code>-2</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum time to retain the log before deleting it.</td>
</tr>
<tr>
<td class="nowrap"><code>log.cleaner.max.compaction.lag.ms</code><br/>
<code>max.compaction.lag.ms</code></td>
<td class="nowrap"><code>9223372036854775807</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum time a message will remain uncompacted in the log.</td>
</tr>
<tr>
<td class="nowrap"><code>max.message.bytes</code><br/>
<code>message.max.bytes</code></td>
<td class="nowrap"><code>1048588</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The largest record batch size allowed by Kafka. Records larger than this will be rejected.</td>
</tr>
<tr>
<td class="nowrap"><code>log.message.downconversion.enable</code><br/>
<code>message.downconversion.enable</code></td>
<td class="nowrap"><code>true</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>Enables or disables the automatic down-conversion of messages to older message formats for consumers with older clients.</td>
</tr>
<tr>
<td class="nowrap"><code>log.message.format.version</code><br/>
<code>message.format.version</code></td>
<td class="nowrap"><code>3.0-IV1</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The message format version used for the topic.</td>
</tr>
<tr>
<td class="nowrap"><code>log.message.timestamp.after.max.ms</code><br/>
<code>message.timestamp.after.max.ms</code></td>
<td class="nowrap"><code>9223372036854775807</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum difference allowed between the timestamp of a message and the log append time.</td>
</tr>
<tr>
<td class="nowrap"><code>log.message.timestamp.before.max.ms</code><br/>
<code>message.timestamp.before.max.ms</code></td>
<td class="nowrap"><code>9223372036854775807</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum difference allowed between the timestamp of a message and the current time before the message is rejected.</td>
</tr>
<tr>
<td class="nowrap"><code>log.message.timestamp.difference.max.ms</code><br/>
<code>message.timestamp.difference.max.ms</code></td>
<td class="nowrap"><code>9223372036854775807</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum difference allowed between the timestamp of a message as set by the producer and the log append time.</td>
</tr>
<tr>
<td class="nowrap"><code>log.message.timestamp.type</code><br/>
<code>message.timestamp.type</code></td>
<td class="nowrap"><code>CreateTime</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>Define whether the timestamp in the message is set by the create time or the log append time.</td>
</tr>
<tr>
<td class="nowrap"><code>log.cleaner.min.cleanable.ratio</code><br/>
<code>min.cleanable.dirty.ratio</code></td>
<td class="nowrap"><code>0.5</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The minimum ratio of dirty log to total log for log compaction to start.</td>
</tr>
<tr>
<td class="nowrap"><code>log.cleaner.min.compaction.lag.ms</code><br/>
<code>min.compaction.lag.ms</code></td>
<td class="nowrap"><code>0</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The minimum time a message will remain uncompacted in the log.</td>
</tr>
<tr>
<td class="nowrap"><code>min.insync.replicas</code></td>
<td class="nowrap"><code>1</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>When a producer sets acks to 'all', the minimum number of replicas that must acknowledge a write for it to be considered successful.</td>
</tr>
<tr>
<td class="nowrap"><code>log.preallocate</code><br/>
<code>preallocate</code></td>
<td class="nowrap"><code>false</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>Should preallocate file segments for this topic.</td>
</tr>
<tr>
<td class="nowrap"><code>remote.storage.enable</code></td>
<td class="nowrap"><code>false</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>Enable the usage of remote storage for this topic.</td>
</tr>
<tr>
<td class="nowrap"><code>log.retention.bytes</code><br/>
<code>retention.bytes</code></td>
<td class="nowrap"><code>-1</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum size of the log before deleting it.</td>
</tr>
<tr>
<td class="nowrap"><code>retention.ms</code></td>
<td class="nowrap"><code>604800000</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum time to retain the log before deleting it.</td>
</tr>
<tr>
<td class="nowrap"><code>log.segment.bytes</code><br/>
<code>segment.bytes</code></td>
<td class="nowrap"><code>1073741824</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum size of a single log segment file before a new log segment is rolled.</td>
</tr>
<tr>
<td class="nowrap"><code>log.index.size.max.bytes</code><br/>
<code>segment.index.bytes</code></td>
<td class="nowrap"><code>10485760</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum size of the offset index that Kafka will allow before a new log segment is rolled.</td>
</tr>
<tr>
<td class="nowrap"><code>segment.jitter.ms</code></td>
<td class="nowrap"><code>0</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum jitter to add to log segment roll time.</td>
</tr>
<tr>
<td class="nowrap"><code>segment.ms</code></td>
<td class="nowrap"><code>604800000</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>The maximum time to retain a log segment before rolling it.</td>
</tr>
<tr>
<td class="nowrap"><code>unclean.leader.election.enable</code></td>
<td class="nowrap"><code>false</code></td>
<td class="middle">&#x274C;</td>
<td class="middle">&#x274C;</td>
<td>Indicates whether unclean leader election is enabled for the topic.</td>
</tr>
</table>

## Legend

- **Names**: The name of the parameter or setting with its synonyms.
- **Default Value**: The initial value assigned to the parameter if not explicitly set.
- **Read-Only**: Indicates if the parameter is immutable and cannot be modified.
- **Sensitive**: Specifies if the parameter contains sensitive information that will not be accessible or visible using Karafka.
- **Description**: A detailed explanation of the parameter's purpose and usage.

## See also

- [Declarative Topics](Declarative-Topics) - For declarative topic management in application code
- [Kafka Cluster Configuration](Kafka-Cluster-Configuration) - For cluster-level configuration options
- [Admin API](Admin-API) - For programmatic topic management operations
