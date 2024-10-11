import React from "react";
import {
  Typography,
  Card,
  CardBody,
  Button,
} from "@material-tailwind/react";

export function Home() {
  return (
    <div className="mt-1 font-poppins bg-gradient-to-r via-white">
      <div className="max-w-6xl mx-auto py-8 px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Typography variant="h4" className="text-4xl md:text-5xl font-bold text-center text-pink-800">
           ¡Bienvenidos a Delicrem!
          </Typography>
          <Typography variant="lead" className="text-gray-700 text-lg leading-relaxed text-center">
            Delicrem es una empresa familiar de cremas artesanales, fundada después de la pandemia. Inicialmente, comenzaron vendiendo cremas debido a la inestabilidad económica y la creciente demanda. Las deliciosas cremas de Delicrem se hicieron populares rápidamente, lo que llevó a la expansión del centro de producción y a la formalización del negocio. La empresa, ubicada en el Barrio los Cerezos en el municipio de Caldas, Antioquia, ha crecido de un pequeño emprendimiento a una empresa grande y estable.
          </Typography>
          
        </div>
        <div className="flex justify-center">
          <img
            src="/img/oreo.jpg"
            alt="Imagen Delicrem"
            className="object-cover w-full h-full rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
          />
        </div>
      </div>
    </div>
  );
}

export default Home;