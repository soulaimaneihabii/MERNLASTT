import { Bar } from 'react-chartjs-2'
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const MedicationsChart = ({ data }) => {
  // Example: count medications by type
  const labels = data?.map(med => med.name) || []
  const counts = data?.map(() => 1) || []

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Médicaments Actifs',
        data: counts,
        backgroundColor: '#f59e0b'
      }
    ]
  }

  return <Bar data={chartData} />
}

export default MedicationsChart
