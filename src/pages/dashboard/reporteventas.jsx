import React from "react";
import * as XLSX from "xlsx";
import axios from "../../utils/axiosConfig";
import Swal from "sweetalert2";

export function ReporteVentas() {
  const generarReporte = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/ventas");
      const ventas = response.data;

      // Obtener la lista de estados
      const estadosResponse = await axios.get("https://finalbackenddelicrem2.onrender.com/api/estados");
      const estados = estadosResponse.data;

      // Crear un diccionario de estados para mapear id_estado con nombre_estado
      const estadosDict = estados.reduce((acc, estado) => {
        acc[estado.id_estado] = estado.nombre_estado;
        return acc;
      }, {});

      const datosReporte = ventas.map((venta) => ({
        "Número de Venta": venta.numero_venta || "N/A",
        "Cliente": venta.cliente?.nombre || "Desconocido",
        "Fecha de Venta": venta.fecha_venta.split("T")[0],
        "Fecha de Entrega": venta.fecha_entrega.split(" ")[0],
        "Estado": estadosDict[venta.id_estado] || "Desconocido",
        "Total": parseFloat(venta.total).toFixed(2),
        
        "Anulación": venta.motivo_anulacion || "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(datosReporte);
      // Ajustar el ancho de las columnas
      const columnWidths = [
        { wch: 20 }, // Número de Venta
        { wch: 15 }, // Cliente
        { wch: 13 }, // Fecha de Venta
        { wch: 22 }, // Fecha de Entrega
        { wch: 22}, // Estado
        { wch: 15 }, // Total
        { wch: 10 }, // Pagado
        { wch: 20 }, // Anulación
      ];
      worksheet["!cols"] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte de Ventas");

      XLSX.writeFile(workbook, "reporte_ventas.xlsx");

      Swal.fire({
        icon: "success",
        title: "Reporte generado correctamente",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      console.error("Error al generar el reporte:", error);
      Swal.fire({
        icon: "error",
        title: "Error al generar el reporte",
        text: "Hubo un problema al generar el reporte de ventas.",
      });
    }
  };

  // Llamar la función de generar reporte cuando se carga el componente
  React.useEffect(() => {
    generarReporte();
  }, []);

  return null;
}
