# Web UI Operational Cost Breakdown

Running the Web UI of Karafka involves costs for data transfer and storage. Below is an estimate to help you understand and plan for these expenses and see the impact of using the Web UI.

!!! Info "Estimate Only"

    The following cost estimation is just an estimate and may differ depending on the Kafka vendor used versus self-hosted setups, among other factors.

## Cost Factors

Several factors influence the cost of running the Karafka Web UI. Understanding these factors can help in managing and optimizing operational expenses. Here is a detailed list of the key cost factors.


!!! Info "Setup Specificity"

    Depending on your specific setup, additional factors may affect costs, or some of the listed factors may not apply.

<table border="1">
    <thead>
        <tr>
            <th>Factor</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Reporting Frequency</td>
            <td>Each Karafka process produces one message every 5 seconds, affecting the total data volume.</td>
        </tr>
        <tr>
            <td>State Materialization</td>
            <td>States are materialized every 5 seconds, impacting storage requirements.</td>
        </tr>
        <tr>
            <td>Message Size</td>
            <td>An average size of 1 KB per message and 30 KB for state data affects data transfer and storage costs.</td>
        </tr>
        <tr>
            <td>Number of Processes</td>
            <td>More processes generate more data, increasing costs.</td>
        </tr>
        <tr>
            <td>Ingress/Egress Cost</td>
            <td>Additional costs for data transfer, including return responses and message acknowledgments.</td>
        </tr>
        <tr>
            <td>Compaction Settings</td>
            <td>Proper configuration reduces storage requirements by managing data efficiently.</td>
        </tr>
        <tr>
            <td>Cluster Settings and Size</td>
            <td>The configuration and size of your Kafka cluster, including the number of brokers and replication factors, impact operational costs.</td>
        </tr>
        <tr>
            <td>Storage Cost</td>
            <td>The cost of storing data, influenced by retention policies, compression, and the amount of data generated and retained.</td>
        </tr>
        <tr>
            <td>Web UI Topics Configuration</td>
            <td>Properly manage and configure Web UI topics to ensure efficient data handling and storage.</td>
        </tr>
    </tbody>
</table>

## Example Calculation

Below, you can find an example calculation that you can use to understand what factors and how they impact running Karafka with Web UI enabled.

<table border="1">
    <thead>
        <tr>
            <th>Category</th>
            <th>Description</th>
            <th>Value</th>
            <th>Details</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td rowspan="2">Rates</td>
            <td>Networking</td>
            <td>$0.05</td>
            <td>Per GB. Same for egress and ingress</td>
        </tr>
        <tr>
            <td>Storage</td>
            <td>$0.08</td>
            <td>Per GB per month</td>
        </tr>
        <tr>
            <td rowspan="7">Reports Data</td>
            <td>Reports per day per consumer process</td>
            <td>17,280</td>
            <td>One report every 5 seconds</td>
        </tr>
        <tr>
            <td>Report size</td>
            <td>1 KB</td>
            <td>Compressed / Approximation</td>
        </tr>
        <tr>
            <td>Daily data per consumer</td>
            <td>17 MB</td>
            <td>17,280 x 1 KB</td>
        </tr>
        <tr>
            <td>Monthly data per consumer</td>
            <td>527 MB</td>
            <td>17 MB x 31 days</td>
        </tr>
        <tr>
            <td>Number of Consumers</td>
            <td>100</td>
            <td>Process with multiple subscription groups counts as one</td>
        </tr>
        <tr>
            <td>Ingress data for 100 consumers</td>
            <td>52.7 GB</td>
            <td>527 MB x 100 consumer processes</td>
        </tr>
        <tr>
            <td>Estimated Storage</td>
            <td>1 GB</td>
            <td>Total storage of Web UI with correct topics settings due to retention</td>
        </tr>
        <tr>
            <td rowspan="3">Reports Cost</td>
            <td>Networking</td>
            <td>$2.63</td>
            <td>$0.05 x 52.7 GB</td>
        </tr>
        <tr>
            <td>Storage</td>
            <td>$0.08</td>
            <td>$0.08 x 1 GB</td>
        </tr>
        <tr>
            <td><strong>Subtotal</strong></td>
            <td><strong>$2.71</strong></td>
            <td>$2.63 + $0.08</td>
        </tr>
        <tr>
            <td rowspan="6">States and Metrics Data</td>
            <td>State Size</td>
            <td>30 KB</td>
            <td>Single State Size</td>
        </tr>
        <tr>
            <td>Total States Data per Month</td>
            <td>16 GB</td>
            <td>30 KB * 535,680 States</td>
        </tr>
        <tr>
            <td>Metrics Size</td>
            <td>60 KB</td>
            <td>Single Metrics Materialization</td>
        </tr>
        <tr>
            <td>Total Metrics Data per Month</td>
            <td>32 GB</td>
            <td>60 KB * 535,680 States</td>
        </tr>
        <tr>
            <td>Reports Consumption Egress</td>
            <td>52.7 GB</td>
            <td>Consumed to materialize states and metrics</td>
        </tr>
        <tr>
            <td>Estimated Storage</td>
            <td>1 GB</td>
            <td>Total storage of Web UI with correct topics settings due to retention</td>
        </tr>
        <tr>
            <td rowspan="3">States and Metrics Cost</td>
            <td>Networking</td>
            <td>$5.03</td>
            <td>$0.05 x (52.7 GB + 32 GB + 16 GB)</td>
        </tr>
        <tr>
            <td>Storage</td>
            <td>$0.08</td>
            <td>$0.08 * 1 GB</td>
        </tr>
        <tr>
            <td><strong>Subtotal</strong></td>
            <td><strong>$5.11</strong></td>
            <td>$5.03 + $0.08</td>
        </tr>
        <tr>
            <td rowspan="4">Total Monthly Cost</td>
            <td>Reports</td>
            <td>$2.71</td>
            <td></td>
        </tr>
        <tr>
            <td>States and Metrics</td>
            <td>$5.11</td>
            <td></td>
        </tr>
        <tr>
            <td>Overestimation Factor</td>
            <td>5x</td>
            <td>Compensate for error tracking, extra networking, etc</td>
        </tr>
        <tr>
            <td><strong>Total</strong></td>
            <td><strong>$39.1</strong></td>
            <td>($2.71 + $5.11) x 5</td>
        </tr>
    </tbody>
</table>


!!! Info "Simplification Notice"

    The calculation above is a simplification, and there may be other factors impacting the cost. This estimate does not include the cost of maintaining a Kafka cluster but rather the additional cost of running the Web UI within an existing cluster.

## Simplified Formula

For a quick estimation, a single Karafka consumer will cost between **$0.07** and **$0.40** per month. This range accounts for the variability in factors such as message frequency, state materialization, data size, and the efficiency of your Kafka configuration.

This simplified formula provides a ballpark figure to help you plan and budget the operational costs of running Karafka with its Web UI. Remember that actual costs can vary based on your specific setup and usage patterns.
