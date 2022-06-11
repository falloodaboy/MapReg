import styles from '../styles/Home.module.css'
import Header from '../components/Header';
import Map from '../components/Map'
const Home = () => {

  function reRenderMap() {
      
  }

  return (
      <>
        <Header header="Polygonal Map Generator"/>
        <Map />
      </>
  )
}

export default Home
