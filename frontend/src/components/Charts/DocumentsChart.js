import { Bar } from 'react-chartjs-2'
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const DocumentsChart = ({ data }) => {
  // Example: count documents by type (if you have type), else just total
  const totalDocuments = Array.isArray(data) ? data.length : 0

  const chartData = {
    labels: ['Documents'],
    datasets: [
      {
        label: 'Nombre de documents',
        data: [totalDocuments],
        backgroundColor: '#ef4444'
      }
    ]
  }

  return <Bar data={chartData} />
}

export default DocumentsChart
