import React, { useState, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Button, Input, Card, CardBody, Typography } from "@material-tailwind/react";
import axios from "../../utils/axiosConfig";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export function GenerarInformeVenta({ onCancel }) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaGeneracion, setFechaGeneracion] = useState(""); 
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [clientesMasCompraron, setClientesMasCompraron] = useState([]);
  const [numeroVentas, setNumeroVentas] = useState(0); 
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [informeGenerado, setInformeGenerado] = useState(false);

  useEffect(() => {
    fetchVentas();
    fetchProductos();
    fetchClientes();
  }, []);

  const fetchVentas = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ventas");
      setVentas(response.data);
    } catch (error) {
      console.error("Error fetching ventas:", error);
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/productos");
      setProductos(response.data);
    } catch (error) {
      console.error("Error fetching productos:", error);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/clientes");
      setClientes(response.data);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    }
  };

  const handleGenerarInforme = () => {
    const hoy = new Date();
    const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    // Validaciones de fechas
    if (!fechaInicio || !fechaFin) {
      Swal.fire({
        icon: "error",
        title: "Fechas inválidas",
        text: "Por favor, selecciona las fechas de inicio y fin.",
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      Swal.fire({
        icon: "error",
        title: "Fechas inválidas",
        text: "La fecha de inicio no puede ser mayor que la fecha de fin.",
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    if (new Date(fechaInicio) > fechaHoy || new Date(fechaFin) > fechaHoy) {
      Swal.fire({
        icon: "error",
        title: "Fechas inválidas",
        text: "Las fechas no pueden ser futuras.",
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    const ventasFiltradas = ventas.filter((venta) => {
      const fechaVenta = new Date(venta.fecha_venta);
      return fechaVenta >= new Date(fechaInicio) && fechaVenta <= new Date(fechaFin);
    });

    if (ventasFiltradas.length === 0) {
      Swal.fire({
        icon: "error",
        title: "No se encontraron ventas",
        text: "No hay ventas dentro del rango de fechas seleccionado.",
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }
    const productosVendidos = {};
    const clientesCompraron = {};

    ventasFiltradas.forEach((venta) => {
      if (Array.isArray(venta.detalles)) {
        venta.detalles.forEach((detalle) => {
          if (!productosVendidos[detalle.id_producto]) {
            const producto = productos.find((p) => p.id_producto === detalle.id_producto);
            productosVendidos[detalle.id_producto] = {
              id_producto: detalle.id_producto,
              cantidad: 0,
              nombre: producto ? producto.nombre : "Desconocido",
            };
          }
          productosVendidos[detalle.id_producto].cantidad += detalle.cantidad || 0;
        });
      }

      if (!clientesCompraron[venta.id_cliente]) {
        const cliente = clientes.find((c) => c.id_cliente === venta.id_cliente);
        clientesCompraron[venta.id_cliente] = {
          id_cliente: venta.id_cliente,
          nombre: cliente ? cliente.nombre : "Desconocido",
          totalComprado: 0,
        };
      }
      clientesCompraron[venta.id_cliente].totalComprado += parseFloat(venta.total) || 0;
    });

    const productosMasVendidos = Object.values(productosVendidos).sort((a, b) => b.cantidad - a.cantidad);
    const clientesMasCompraron = Object.values(clientesCompraron).sort((a, b) => b.totalComprado - a.totalComprado);

    setProductosMasVendidos(productosMasVendidos);
    setClientesMasCompraron(clientesMasCompraron);

    const fechaActual = new Date().toLocaleDateString();
    setFechaGeneracion(fechaActual);
    setNumeroVentas(ventasFiltradas.length);
    setInformeGenerado(true);

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end', // Puedes cambiar la posición según lo desees
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
     
      
    });



    
    Swal.fire({
      position: 'top-end', // Cambia la posición según lo necesites
      icon: "success",
      title: "Informe de Ventas generado con éxito",
      showConfirmButton: false,
      timer: 2000,
      toast: true, // Esto convierte la alerta en un toast
      timerProgressBar: true, // Esto muestra una barra de progreso
    });
    
  };

  const handleDescargarInforme = () => {
    // Crear datos para el archivo Excel
    const datosExcel = [
      { encabezado: "Informe de Ventas", valor: "" },
      { encabezado: "Fecha de Generación", valor: fechaGeneracion },
      { encabezado: "Periodo", valor: `${fechaInicio} - ${fechaFin}` },
      { encabezado: "Número de Ventas Realizadas", valor: numeroVentas },
      {},
      { encabezado: "Productos más vendidos", valor: "" },
      ...productosMasVendidos.map(producto => ({
        encabezado: producto.nombre,
        valor: producto.cantidad,
      })),
      {},
      { encabezado: "Clientes que más compraron", valor: "" },
      ...clientesMasCompraron.map(cliente => ({
        encabezado: cliente.nombre,
        valor: `$${cliente.totalComprado.toFixed(2)}`,
      })),
    ];
  
    // Crear hoja de trabajo (worksheet)
    const ws = XLSX.utils.json_to_sheet(datosExcel, { header: ["encabezado", "valor"] });
  
    // Establecer estilos para la hoja
    const encabezados = [
      "A1", "A2", "A3", "A4", "A6", "A8" // Índices de celdas para encabezados
    ];
  
    encabezados.forEach(celda => {
      // Asegúrate de que la celda está definida antes de aplicar estilos
      if (ws[celda]) {
        ws[celda].s = {
          font: { bold: true, sz: 14 }, // Negrita y tamaño de fuente
          alignment: { horizontal: "left" },
        };
      }
    });
  
    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 40 }, // Encabezado (más ancho)
      { wch: 20 }, // Valor
    ];
    ws["!cols"] = columnWidths;
  
    // Crear libro de trabajo (workbook)
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Informe de Ventas");
  
    // Descargar el archivo Excel
    XLSX.writeFile(wb, `informe_ventas_${fechaGeneracion}.xlsx`);
  };
  
  const productosLabels = productosMasVendidos.map(producto => producto.nombre);
  const productosData = productosMasVendidos.map(producto => producto.cantidad);

  const productosChartData = {
    labels: productosLabels,
    datasets: [
      {
        label: 'Cantidad Vendida',
        data: productosData,
        backgroundColor: [
          '#AE017D91', 
          '#7A017892',
          '#48006A7C', 
         
        ],
        
      },
    ],
  };

  const clientesLabels = clientesMasCompraron.map(cliente => cliente.nombre);
  const clientesData = clientesMasCompraron.map(cliente => cliente.totalComprado);

  const clientesChartData = {
    labels: clientesLabels,
    datasets: [
      {
        label: 'Total Comprado',
        data: clientesData,
        backgroundColor: [
          '#AE017D91', 
          '#7A017892', 
          '#48006A7C', 
          
        ],
        borderColor: [
          '#AE017E', 
          '#7A0177', 
          '#49006A', 
        
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const chartOptions = {
  maintainAspectRatio: false,
  responsive: true,
  aspectRatio: 1.5,
  scales: {
    y: {
      beginAtZero: true, // Esto asegura que la escala comience desde 0
      ticks: {
        stepSize: 100, // Puedes ajustarlo o eliminarlo si no deseas una separación fija
        },
      },
    },
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow-lg max-w-4xl mx-auto p-6">
      <Card>
        <CardBody>
          <Typography variant="h6" className="text-gray-800 font-bold mb-4">Generar Informe de Ventas</Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <Input
              type="date"
              label="Fecha Inicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
            <Input
              type="date"
              label="Fecha Fin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <div className="flex gap-4 mb-6">
            <Button color="blue" onClick={handleGenerarInforme} className="btnagregarm" size="sm">Generar Informe</Button>
            <Button color="red" onClick={onCancel} className="cancelarinformes" size="sm">Cancelar</Button>
          </div>

          {informeGenerado && (
            <>
              <Typography variant="h6" className="text-gray-800 font-semibold mb-2">Fecha de generación del informe: <span className="font-normal">{fechaGeneracion}</span></Typography>
              <Typography variant="h6" className="text-gray-800 font-semibold mb-2">Periodo del informe: <span className="font-normal">{fechaInicio} - {fechaFin}</span></Typography>
              <Typography variant="h6" className="text-gray-800 font-semibold mb-2">Número de ventas realizadas en el periodo: <span className="font-normal">{numeroVentas}</span></Typography>

              <Typography variant="h6" className="text-gray-800 font-semibold mt-6 mb-2">Productos más vendidos:</Typography>
              <div className="relative h-72">
                <Bar data={productosChartData} options={chartOptions} />
              </div>

              <Typography variant="h6" className="text-gray-800 font-semibold mt-6 mb-2">Clientes que más compraron:</Typography>
              <div className="relative h-72">
                <Doughnut data={clientesChartData} options={chartOptions} />
              </div>

              <div className="flex justify-end mt-6">
  <Button className="px-4 py-2" onClick={handleDescargarInforme}>
    Descargar Informe
  </Button>
</div>

            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
