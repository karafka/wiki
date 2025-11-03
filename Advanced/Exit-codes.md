Each Karafka process defines exit statuses to indicate how the process terminated, offering clarity on operational outcome. Below, you can find the meaning behind each of the exit codes used:

<table>
  <tr>
    <th>Exit Code</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>0</code></td>
    <td>Smooth shutdown: all work completed as expected, consumers stopped, etc.</td>
  </tr>
  <tr>
    <td><code>1</code></td>
    <td>Ruby exit code for syntax errors or other boot problems.</td>
  </tr>
  <tr>
    <td><code>2</code></td>
    <td>Forceful shutdown: not all consumers finished their work due to exceeding <code>shutdown_timeout</code>.</td>
  </tr>
  <tr>
    <td><code>3</code></td>
    <td>Exit code for an orphaned Swarm node.</td>
  </tr>
</table>

## See also

- [Deployment](Deployment) - Handling exit codes in production deployments
- [Signals and States](Signals-and-States) - Understanding process lifecycle and signals
