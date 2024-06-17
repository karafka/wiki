This page presents the Software Bill of Materials (SBOM) for Karafka and its runtime dependencies. An SBOM is a comprehensive inventory that details the components, libraries, and software packages utilized in a software product. It plays a crucial role in understanding the software's composition, enhancing transparency, and bolstering security by identifying potential vulnerabilities.

This page exists because of our commitment to security, compliance, and transparency. It serves as a resource for users and developers to understand the external dependencies that Karafka relies on during operation.

!!! note "Runtime Dependencies in the Karafka SBOM"

    This SBOM explicitly contains only the Karafka ecosystem's runtime dependencies. This document does not include development and test dependencies, which are crucial during the build and testing phases but are not required for the software's operation.

!!! tip "License Variability in OSS Dependencies"

    Please be aware that the license status of the dependencies within the Karafka ecosystem may change over time due to the dynamic nature of open-source software (OSS) and dependency management. While we strive to keep this SBOM as accurate and up-to-date as possible, it represents a best-effort snapshot. For those seeking to construct a comprehensive and current SBOM for their projects, incorporating all dependencies accurately, we recommend utilizing tools such as [Mend.io](https://www.mend.io/open-source-license-compliance/). Mend.io can help automate the creation of a detailed SBOM, ensuring it reflects the complete state of your target software, including any license changes in its dependencies.

## karafka + subcomponents

<table>
  <thead>
    <tr>
      <th>Software</th>
      <th>Version</th>
      <th>License</th>
      <th>Copyrights</th>
    </tr>
  </thead>
  <tbody>
  <tr>
    <td>
      karafka
    </td>
    <td>
      2.0+ (without Pro enhancements)
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/karafka/karafka/blob/master/LICENSE-LGPL">LGPL-3.0-only</a>
    </td>
    <td>Maciej Mensfeld</td>
  </tr>

  <tr>
    <td>
      karafka pro
    </td>
    <td>
      2.0+ (Pro enhancements)
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/karafka/karafka/blob/master/LICENSE-COMM">Commercial</a>
    </td>
    <td>Maciej Mensfeld</td>
  </tr>

  <tr>
    <td>
      karafka-core
    </td>
    <td>
      2.0+
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/karafka/karafka-core/blob/master/MIT-LICENSE">MIT</a>
    </td>
    <td>Maciej Mensfeld</td>
  </tr>

  <tr>
    <td>
      waterdrop
    </td>
    <td>
      All
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/karafka/karafka-core/blob/master/MIT-LICENSE">MIT</a>
    </td>
    <td>Maciej Mensfeld</td>
  </tr>

  <tr>
    <td>
      zeitwerk
    </td>
    <td>
      All
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/fxn/zeitwerk/blob/main/MIT-LICENSE">MIT</a>
    </td>
    <td>Xavier Noria</td>
  </tr>

  <tr>
    <td>
      karafka-web
    </td>
    <td>
      All (without Pro enhancements)
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/karafka/karafka/blob/master/LICENSE-LGPL">LGPL-3.0-only</a>
    </td>
    <td>Maciej Mensfeld</td>
  </tr>

  <tr>
    <td>
      karafka-web pro
    </td>
    <td>
      All (Pro enhancements)
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/karafka/karafka/blob/master/LICENSE-COMM">Commercial</a>
    </td>
    <td>Maciej Mensfeld</td>
  </tr>

  <tr>
    <td>
      e-ruby
    </td>
    <td>
      All
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/jeremyevans/erubi/blob/master/MIT-LICENSE">MIT</a>
    </td>
    <td>Jeremy Evans</td>
  </tr>

  <tr>
    <td>
      roda
    </td>
    <td>
      All
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/jeremyevans/roda/blob/master/MIT-LICENSE">MIT</a>
    </td>
    <td>Jeremy Evans</td>
  </tr>

  <tr>
    <td>
      tilt
    </td>
    <td>
      All
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/jeremyevans/tilt/blob/master/COPYING">MIT</a>
    </td>
    <td>Jeremy Evans</td>
  </tr>

  <tr>
    <td>
      bootstrap
    </td>
    <td>
      5.2.3
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/twbs/bootstrap/blob/main/LICENSE">MIT</a>
    </td>
    <td>Twitter, Inc.</td>
  </tr>

  <tr>
    <td>
      air datepicker
    </td>
    <td>
      3.4.0
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/t1m0n/air-datepicker/blob/v3/LICENSE.md">MIT</a>
    </td>
    <td>Timofey Marochkin</td>
  </tr>

  <tr>
    <td>
      highlight.js + embedded themes
    </td>
    <td>
      11.7.0
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/highlightjs/highlight.js/blob/main/LICENSE">BSD-3-Clause</a>
    </td>
    <td>Ivan Sagalaev</td>
  </tr>

  <tr>
    <td>
      chart.js
    </td>
    <td>
      4.1.1
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/chartjs/Chart.js/blob/master/LICENSE.md">MIT</a>
    </td>
    <td>Chart.js Contributors</td>
  </tr>

  <tr>
    <td>
      color
    </td>
    <td>
      0.3.0
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/kurkle/color/blob/main/LICENSE.md">MIT</a>
    </td>
    <td>Jukka Kurkela</td>
  </tr>

  <tr>
    <td>
      timeago.js
    </td>
    <td>
      4.0.2
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/hustcc/timeago.js/blob/master/LICENSE">MIT</a>
    </td>
    <td>Hust.cc</td>
  </tr>

  </tbody>
</table>

## rdkafka-ruby + subcomponents

<table>
  <thead>
    <tr>
      <th>Software</th>
      <th>Version</th>
      <th>License</th>
      <th>Copyrights</th>
    </tr>
  </thead>
  <tbody>
  <tr>
    <td>
      rdkafka / rdkafka-ruby
    </td>
    <td>
      All
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/karafka/rdkafka-ruby/blob/main/MIT-LICENSE">MIT</a>
    </td>
    <td>Maciej Mensfeld + project contributors</td>
  </tr>
  <tr>
    <td>
      ffi
    </td>
    <td>
      All
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/ffi/ffi/blob/master/LICENSE">BSD-3-Clause</a>
    </td>
    <td>Ruby FFI project contributors</td>
  </tr>
  <tr>
    <td>
      mini_portile2
    </td>
    <td>
      All
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/flavorjones/mini_portile/blob/main/LICENSE.txt">MIT</a>
    </td>
    <td>
      Luis Lavena and Mike Dalessio
    </td>
  </tr>
  <tr>
    <td>
      rake
    </td>
    <td>
      All
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/ruby/rake/blob/v13.1.0/MIT-LICENSE">MIT</a>
    </td>
    <td>Jim Weirich</td>
  </tr>
</tbody>
</table>

## librdkafka + subcomponents

<table>
  <thead>
    <tr>
      <th>Software</th>
      <th>Version</th>
      <th>License</th>
      <th>Copyrights</th>
    </tr>
  </thead>
  <tbody>
  <tr>
    <td>
      librdkafka
    </td>
    <td>2.4.0</td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/confluentinc/librdkafka/blob/master/LICENSE">BSD-2-Clause</a>
    </td>
    <td>Confluent Inc.</td>
  </tr>

  <tr>
    <td>
      cJSON
    </td>
    <td>1.7.14</td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/confluentinc/librdkafka/blob/master/LICENSE.cjson">MIT</a>
    </td>
    <td>Dave Gamble and cJSON contributors</td>
  </tr>

  <tr>
    <td>
    crc32c
    </td>
    <td>
    1.1
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/confluentinc/librdkafka/blob/master/LICENSE.crc32c">Zlib</a>
    </td>
    <td>
      Mark Adler
    </td>
  </tr>

  <tr>
    <td>
      rdfnv1a
    </td>
    <td>
      N/A
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/confluentinc/librdkafka/blob/master/LICENSE.fnv1a">Public Domain</a>
    </td>
    <td>
    Landon Curt Noll
    </td>
  </tr>

  <tr>
    <td>
      rdhdrhistogram
    </td>
    <td>
      N/A
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/confluentinc/librdkafka/blob/master/LICENSE.hdrhistogram">MIT</a>
    </td>
    <td>
      Coda Hale
    </td>
  </tr>

  <tr>
    <td>
      murmur2
    </td>
    <td>
      N/A
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/confluentinc/librdkafka/blob/master/LICENSE.murmur2">Public Domain</a>
    </td>
    <td>
      Austin Appleby
    </td>
  </tr>

  <tr>
    <td>
      pycrc / rdcrc32
    </td>
    <td>
      0.7.10
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/confluentinc/librdkafka/blob/master/LICENSE.pycrc">MIT</a>
    </td>
    <td>
      Thomas Pircher
    </td>
  </tr>

  <tr>
    <td>
      queue
    </td>
    <td>
      8.5
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/confluentinc/librdkafka/blob/master/LICENSE.queue">BSD</a>
    </td>
    <td>
      The Regents of the University of California
    </td>
  </tr>

  <tr>
    <td>
      regexp
    </td>
    <td>
      N/A
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/confluentinc/librdkafka/blob/master/LICENSE.regexp">Public Domain</a>
    </td>
    <td>
      Tor Andersson
    </td>
  </tr>

  <tr>
    <td>
      snappy
    </td>
    <td>
      1.1.0
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/confluentinc/librdkafka/blob/master/LICENSE.snappy">BSD-3-Clause</a> 
    </td>
    <td>
      Intel Corporation
    </td>
  </tr>

  <tr>
    <td>
      tinycthread
    </td>
    <td>
      1.2
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/confluentinc/librdkafka/blob/master/LICENSE.tinycthread">Zlib</a>
    </td>
    <td>
      Evan Nemerson
    </td>
  </tr>

  <tr>
    <td>
      wingetopt
    </td>
    <td>
      N/A
    </td>
    <td>
      <a rel="nofollow noopener noreferrer" href="https://github.com/confluentinc/librdkafka/blob/master/LICENSE.wingetopt">ISC</a>
    </td>
    <td>
      The NetBSD Foundation
    </td>
  </tr>

    </tbody>
</table>
