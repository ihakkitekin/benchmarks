const template = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Benchmark Results</title>
    <link
      rel="stylesheet"
      href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
      integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
      crossorigin="anonymous"
    />
    <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.8.0/Chart.min.js" integrity="sha256-Uv9BNBucvCPipKQ2NS9wYpJmi8DTOEfTA/nH2aoJALw=" crossorigin="anonymous"></script>
  </head>
  <body>
    <h2 class="text-center text-success mt-3 mb-5">{{__pageTitle}} Benchmark Results: {{__date}}</h2>
    <div class="container mb-5 mt-3">
      <h3 class="text-center text-primary mb-3">Conditions</h3>
      <table class="table table-hover table-sm">
        <thead>
          <tr>
            <th scope="col">Benchmark name</th>
            <th scope="col">Duration for each round</th>
            <th scope="col">Total rounds</th>
            <th scope="col">Connections</th>
            <th scope="col">CPU limit</th>
            <th scope="col">Memory limit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{benchmarkName}}</td>
            <td>{{durationEach}}</td>
            <td>{{rounds}}</td>
            <td>{{connections}}</td>
            <td>{{resources.cpus}}</td>
            <td>{{resources.memory}}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="container mb-5 mt-3">
      <h3 class="text-center text-primary mb-3">Final Results</h3>
      {{#finalResults}}
      <table class="table table-hover table-sm mb-5">
        <h4 class="text-info">Results for {{path}}</h3>
        <thead>
          <tr>
            <th scope="col">Application</th>
            <th scope="col">Total requests</th>
            <th scope="col">Average RPS</th>
            <th scope="col">Average requests</th>
            <th scope="col">Average latency</th>
            <th scope="col">Total errors</th>
            <th scope="col">Total timeouts</th>
            <th scope="col">CPU usage</th>
            <th scope="col">Memory usage</th>
          </tr>
        </thead>
        <tbody>
          {{#frameworks}}
          <tr>
            <td>{{app}}</td>
            <td>{{totalRequests}}</td>
            <td>{{averageRps}}</td>
            <td>{{averageRequests}}</td>
            <td>{{averageLatency}} ms</td>
            <td>{{totalErrors}}</td>
            <td>{{totalTimeouts}}</td>
            <td><a href="javascript:void(0)" data-toggle="modal" data-target="#graphModal" onclick="openModal({{cpu}}, '% CPU Usage')">Show</a></td>
            <td><a href="javascript:void(0)" data-toggle="modal" data-target="#graphModal" onclick="openModal({{memory}}, '% Memory Usage')">Show</a></td>
          </tr>
          {{/frameworks}}
        </tbody>
      </table>
      {{/finalResults}}
    </div>
    <div class="container mb-3 mt-3">
      <h3 class="text-center text-primary mb-3">Round by Round Results</h3>
      {{#roundByRound.paths}}
      <h4 class="mb-3 text-info">Results for {{path}}</h3>
      {{#rounds}}
      <table class="table mb-5 table-hover table-sm">
        <h5 class="text-secondary">Round {{round}}</h3>
        <thead>
          <tr>
            <th scope="col">Application</th>
            <th scope="col">Total requests</th>
            <th scope="col">RPS</th>
            <th scope="col">Average latency</th>
            <th scope="col">Errors</th>
            <th scope="col">Timeouts</th>
          </tr>
        </thead>
        <tbody>
          {{#results}}
          <tr>
            <td>{{name}}</td>
            <td>{{result.totalRequests}}</td>
            <td>{{result.rps}}</td>
            <td>{{result.averageLatency}} ms</td>
            <td>{{result.errors}}</td>
            <td>{{result.timeouts}}</td>
          </tr>
          {{/results}}
        </tbody>
      </table>
      {{/rounds}}
      {{/roundByRound.paths}}
    </div>
    <div class="modal fade" id="graphModal" tabindex="-1" role="dialog" aria-labelledby="graphModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-body" >
          <canvas width="800" height="600" id="chartCtx"></canvas>
        </div>
      </div>
    </div>
    </div>
    <script>
      function openModal(data, title) {
        var chart = new Chart('chartCtx', {
              type: 'line',
              data: {
                  labels: new Array(data.length).fill(''),
                  datasets: [{
                      label: title,
                      data: data,
                      backgroundColor: [
                          'rgba(255, 99, 132, 0.2)',
                          'rgba(54, 162, 235, 0.2)',
                          'rgba(255, 206, 86, 0.2)',
                          'rgba(75, 192, 192, 0.2)',
                          'rgba(153, 102, 255, 0.2)',
                          'rgba(255, 159, 64, 0.2)'
                      ],
                      borderColor: [
                          'rgba(255, 99, 132, 1)',
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 206, 86, 1)',
                          'rgba(75, 192, 192, 1)',
                          'rgba(153, 102, 255, 1)',
                          'rgba(255, 159, 64, 1)'
                      ],
                      borderWidth: 1
                  }]
              }
          })
      }  
  </script>
  </body>
</html>`;

module.exports.template = template;
