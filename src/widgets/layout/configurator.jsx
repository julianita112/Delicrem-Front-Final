import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button, IconButton, Typography } from "@material-tailwind/react";
import {
  useMaterialTailwindController,
  setOpenConfigurator,
  setSidenavColor,
  setSidenavType,
} from "@/context";

const formatNumber = (number, decPlaces) => {
  const dec = Math.pow(10, decPlaces);
  const abbrev = ["K", "M", "B", "T"];

  for (let i = abbrev.length - 1; i >= 0; i--) {
    const size = Math.pow(10, (i + 1) * 3);
    if (size <= number) {
      number = Math.round((number * dec) / size) / dec;
      if (number === 1000 && i < abbrev.length - 1) {
        number = 1;
        i++;
      }
      return number + abbrev[i];
    }
  }
  return number;
};

export function Configurator() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { openConfigurator, sidenavColor, sidenavType } = controller;
  const [stars, setStars] = useState(0);

  const sidenavColors = {
    white: "from-gray-100 to-gray-100 border-gray-200",
    dark: "from-black to-black border-gray-200",
    pink: "from-pink-700 to-pink-800",
  };

  useEffect(() => {
    fetch("https://api.github.com/repos/creativetimofficial/material-tailwind-dashboard-react")
      .then((response) => response.json())
      .then((data) => setStars(formatNumber(data.stargazers_count, 1)));
  }, []);

  return (
    <aside
      className={`fixed top-1/4 right-0 z-50 h-auto w-86 bg-white px-2.5 shadow-lg transition-transform duration-300 transform -translate-y-1/2 ${
        openConfigurator ? "translate-x-0" : "translate-x-96"
      }`}
    >
      <div className="flex items-start justify-between px-2 pt-8 pb-0">
        <Typography variant="h5" color="blue-gray">Personalización menú</Typography>
        <IconButton
          variant="text"
          color="blue-gray"
          onClick={() => setOpenConfigurator(dispatch, false)}
        >
          <XMarkIcon strokeWidth={3.5} className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="py-4 px-4">
        <section className="mb-2">
          <Typography variant="h6" color="blue-gray">Colores del botón del menú</Typography>
          <div className="mt-3 flex items-center gap-2">
            {Object.keys(sidenavColors).map((color) => (
              <span
                key={color}
                className={`h-12 w-12 cursor-pointer rounded-full border bg-gradient-to-br transition-transform hover:scale-105 ${
                  sidenavColors[color]
                } ${sidenavColor === color ? "border-black" : "border-transparent"}`}
                onClick={() => setSidenavColor(dispatch, color)}
              />
            ))}
          </div>
        </section>
        <section className="mb-10">
          <Typography variant="h6" color="blue-gray">Variaciones de colores del menú</Typography>
          <div className="mt-3 flex items-center gap-2">
            {["dark", "transparent", "white"].map((type) => (
              <Button
                key={type}
                variant={sidenavType === type ? "gradient" : "outlined"}
                onClick={() => setSidenavType(dispatch, type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

Configurator.displayName = "/src/widgets/layout/configurator.jsx";
export default Configurator;