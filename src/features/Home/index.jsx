import React from 'react'
import OLMap from '../../components/OLMap';

import data from "../../data/province.json"



const Home = () => {
  return (
    <div className='w-screen h-screen'>
      <OLMap
        geojsonData={data}
        zoom={10}
        onFeatureClick={(props) => console.log("Thông tin:", props)}
        isReport
        isSidebar
        isDraw
        />
    </div>
  )
}

export default Home
