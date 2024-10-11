import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import { PlusIcon, EyeIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import Swal from "sweetalert2";
import { CrearCompra } from "./CrearCompra";
import { ReporteCompras } from "./ReporteCompras"; 
import { GenerarInforme } from "./GenerarInforme"; 

export function Compras() {
  const [compras, setCompras] = useState([]);
  const [filteredCompras, setFilteredCompras] = useState([]);
  const [showForm, setShowForm] = useState(false); 
  const [proveedores, setProveedores] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [selectedCompra, setSelectedCompra] = useState({
    id_proveedor: "",
    fecha_compra: "",
    fecha_registro: "",
    estado: "Completado",
    detalleCompras: [], 
    proveedorCompra: { nombre: "", contacto: "" },
    total: 0,
  });
  const [showDetails, setShowDetails] = useState(false); 
  const [currentPage, setCurrentPage] = useState(1);
  const [comprasPerPage] = useState(6);
  const [search, setSearch] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false); 
  const [motivoAnulacion, setMotivoAnulacion] = useState(''); 
  const [compraToCancel, setCompraToCancel] = useState(null);
  const [mostrarReporte, setMostrarReporte] = useState(false); 
  const [mostrarInforme, setMostrarInforme] = useState(false); 

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  useEffect(() => {
    fetchCompras();
    fetchProveedores();
    fetchInsumos();
  }, []);

  const fetchCompras = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/compras");
      setCompras(response.data);
      setFilteredCompras(response.data);
    } catch (error) {
      console.error("Error fetching compras:", error);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const fetchProveedores = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/proveedores");
      setProveedores(response.data);
    } catch (error) {
      console.error("Error fetching proveedores:", error);
    }
  };

  const fetchInsumos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/insumos");
      setInsumos(response.data);
    } catch (error) {
      console.error("Error fetching insumos:", error);
    }
  };

  useEffect(() => {
    filterCompras();
  }, [search, compras]);

  const filterCompras = () => {
    const filtered = compras.filter((compra) =>
      compra.proveedorCompra?.nombre?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCompras(filtered);
  };

  const handleCreate = () => {
    setSelectedCompra({
      id_proveedor: "",
      fecha_compra: "",
      fecha_registro: "",
      estado: "Completado",
      detalleCompras: [], 
      proveedorCompra: { nombre: "", contacto: "" },
      total: 0,
    });
    setShowForm(true); 
  };

  const handleSaveSuccess = () => {
    setShowForm(false);
    fetchCompras();
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const handleViewDetails = (compra) => {
    setSelectedCompra({
      ...compra,
      detalleCompras: compra.detalleComprasCompra || [], 
      proveedorCompra: compra.proveedorCompra || { nombre: "", contacto: "" },
      fecha_compra: compra.fecha_compra?.split('T')[0], 
      fecha_registro: compra.fecha_registro?.split('T')[0], 
      total: parseFloat(compra.total) || 0, 
      motivo_anulacion: compra.motivo_anulacion || "N/A", 
    });
    setShowDetails(true); 
  };

  const handleCloseDetails = () => {
    setShowDetails(false); 
  };

  const toggleCancel = (id_compra) => {
    setCompraToCancel(id_compra);
    setCancelOpen(true); 
  };

  const handleCancelCompra = async () => {
    if (!motivoAnulacion.trim()) {
      Toast.fire({
        icon: 'error',
        title: 'Debe proporcionar un motivo de anulación.',
      });
      return;
    }

    try {
      // Cambiar el id_estado a 5, que representa "Anulado"
      await axios.patch(`http://localhost:3000/api/compras/${compraToCancel}/estado`, { 
        id_estado: 5, 
        motivo_anulacion: motivoAnulacion 
      });
      fetchCompras(); 
      Toast.fire({
        icon: 'success',
        title: 'La compra ha sido anulada correctamente.',
      });
      setCancelOpen(false);
      setMotivoAnulacion('');
    } catch (error) {
      console.error("Error al anular la compra:", error.response?.data || error.message);
      Toast.fire({
        icon: 'error',
        title: `Hubo un problema al anular la compra: ${error.response?.data?.error || error.message}`,
      });
    }
  };

  const handleGenerarReporte = () => {
    setMostrarReporte(true);
  };

  const handleGenerarInforme = () => {
    setMostrarInforme(true);
  };

  const handleCancelarInforme = () => {
    setMostrarInforme(false);
  };

  const indexOfLastCompra = currentPage * comprasPerPage;
  const indexOfFirstCompra = indexOfLastCompra - comprasPerPage;
  const currentCompras = filteredCompras.slice(indexOfFirstCompra, indexOfLastCompra);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredCompras.length / comprasPerPage); i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <div className="relative h-20 w-full overflow-hidden rounded-xl bg-cover bg-center">
        <div className="absolute inset-0 h-full w-full bg-white-900/75" />
      </div>
      <Card className="mx-2 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
          {!mostrarInforme && !showForm ? (
            <>
              <div className="flex items-center gap-2.5 -mt-1">
              <Button
  onClick={handleCreate}
  className="btnagregar py-2 mt-6"
  style={{ width: '20%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  size="sm"
  startIcon={<PlusIcon />}
>
  Crear Compra
</Button>

                <Button 
                  onClick={handleGenerarReporte}  
                  className="bg-gray-200  text-blue-gray-900 hover:bg-gray-300 transition rounded px-4 py-2 normal-case"
                 
                >
                  Reporte
                </Button>
                <Button 
                  onClick={handleGenerarInforme} 
                  className="bg-gray-200  text-blue-gray-900 hover:bg-gray-300 transition rounded px-4 py-2 normal-case"
                  size="sm"
                >
                  Informe
             
                </Button>


                <input
            type="text"
            placeholder="Buscar por nombre de Proveedor..."
            value={search}
            onChange={handleSearchChange}
            className="ml-40 border border-gray-300 rounded-md focus:border-blue-500 appearance-none shadow-none py-2 px-4 text-sm"
            style={{ width: '265px', marginLeft: '200px' }} // Ajusta el ancho del campo de búsqueda
          />




              </div>  
                          
              <div className="mb-1">
                <Typography variant="h5" color="blue-gray" className="mb-4">
                  Lista de Compras
                </Typography>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número de Recibo</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Compra</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Registro</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCompras.map((compra) => (
                        <tr key={compra.id_compra} className="border-b">
                          <td className="py-2 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{compra.numero_recibo || "N/A"}</td>
                          <td className="py-2 px-4 whitespace-nowrap text-sm">{compra.proveedorCompra?.nombre || "Desconocido"}</td>
                          <td className="py-2 px-4 whitespace-nowrap text-sm">{compra.fecha_compra?.split("T")[0]}</td>
                          <td className="py-2 px-4 whitespace-nowrap text-sm">{compra.fecha_registro?.split("T")[0]}</td>
                          <td className="py-2 px-4 whitespace-nowrap text-sm">{compra.id_estado === 5 ? 'Anulado' : 'Completado'}</td>
                          <td className="py-2 px-4 whitespace-nowrap text-sm">${parseFloat(compra.total).toFixed(2)}</td>
                          
                          <td className="py-3 px-6 flex gap-2">
                            <IconButton className="btnvisualizar" size="sm" onClick={() => handleViewDetails(compra)}>
                              <EyeIcon className="h-5 w-5" />
                            </IconButton>

                            <Button
                              className={`${
                                compra.id_estado === 5 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-700 hover:bg-red-800'
                              } text-white rounded-sm px-1.5 py-0.5 transition h-7 w-16 normal-case`}
                              onClick={() => toggleCancel(compra.id_compra)}
                              disabled={compra.id_estado === 5}
                            >
                              {compra.id_estado === 5 ? 'Anulada' : 'Anular'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <ul className="flex justify-center items-center space-x-2">
                    {pageNumbers.map((number) => (
                      <Button
                        key={number}
                        onClick={() => paginate(number)}
                        className={`pagination ${number === currentPage ? "active" : ""}`}
                        size="sm"
                      >
                        {number}
                      </Button>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : mostrarInforme ? (
            <GenerarInforme onCancel={handleCancelarInforme} />
          ) : (
            <CrearCompra
              handleClose={handleCancel}
              fetchCompras={fetchCompras}
              proveedores={proveedores}
              insumos={insumos}
              onSaveSuccess={handleSaveSuccess}
            />
          )}
        </CardBody>
      </Card>

      {/* Modal para ver detalles de la compra */}
      <Dialog open={showDetails} handler={handleCloseDetails} className="overflow-auto max-h-[90vh] rounded-lg shadow-lg border border-gray-200">
        <DialogHeader className=" text-blue-gray-900 p-4 border-b border-gray-200">
          <Typography variant="h4" className="font-semibold">Detalles de la Compra</Typography>
        </DialogHeader>
        <DialogBody divider className="overflow-auto max-h-[60vh] p-4 bg-white">
          <div className="mb-4">
            <Typography variant="h6" color="blue-gray" className="font-semibold mb-2">
              Número de Recibo:
              <div className="text-gray-900 mt-1">
                {selectedCompra.numero_recibo || "N/A"}
              </div>
            </Typography>
          </div>
          {selectedCompra.proveedorCompra && (
            <div className="mb-4">
              <Typography variant="h6" color="blue-gray" className="font-semibold mb-2">
                Información del Proveedor
              </Typography>
              <table className="min-w-full border-separate border-spacing-4 border-gray-300">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="font-medium text-gray-700 px-4 py-2">ID Proveedor:</td>
                    <td className="text-gray-900 px-4 py-2">{selectedCompra.proveedorCompra.id_proveedor}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="font-medium text-gray-700 px-4 py-2">Nombre:</td>
                    <td className="text-gray-900 px-4 py-2">{selectedCompra.proveedorCompra.nombre}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="font-medium text-gray-700 px-4 py-2">Contacto:</td>
                    <td className="text-gray-900 px-4 py-2">{selectedCompra.proveedorCompra.contacto}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-6">
            <Typography variant="h5" color="blue-gray" className="font-semibold mb-2">
              Detalles de la Compra
            </Typography>
            <table className="min-w-full border-separate border-spacing-4 border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-2 text-left font-semibold text-gray-700">ID de Compra</th>
                  <th className="px-6 py-2 text-left font-semibold text-gray-700">Nombre Insumo</th>
                  <th className="px-6 py-2 text-left font-semibold text-gray-700">Cantidad</th>
                  <th className="px-6 py-2 text-left font-semibold text-gray-700">Precio Unitario</th>
                </tr>
              </thead>
              <tbody>
                {(selectedCompra.detalleCompras || []).map((detalle) => (
                  <tr key={detalle.id_detalle_compra} className="border-t border-gray-300 hover:bg-gray-50">
                    <td className="px-6 py-2 text-gray-900 text-center">{detalle.id_detalle_compra}</td>
                    <td className="px-6 py-2 text-gray-900 text-center">{insumos.find(ins => ins.id_insumo === detalle.id_insumo)?.nombre || "Desconocido"}</td>
                    <td className="px-6 py-2 text-gray-900 text-center">{detalle.cantidad}</td>
                    <td className="px-6 py-2 text-gray-900 text-center">{Number(detalle.precio_unitario).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6">
              <Typography variant="h6" color="blue-gray" className="font-semibold">
                Motivo Anulación: {selectedCompra.motivo_anulacion || "N/A"}
              </Typography>
              <Typography variant="h5" color="blue-gray" className="font-semibold">
                Total: ${parseFloat(selectedCompra.total).toFixed(2)}
              </Typography>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="bg-gray-100 p-4 flex justify-end border-t border-gray-200 rounded-b-lg">
          <Button variant="gradient" className="btncancelarm" size="sm" color="blue-gray" onClick={handleCloseDetails}>
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>

     {/* Modal para capturar motivo de anulación */}
{cancelOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full transition-transform transform scale-100 hover:scale-105">
      <Typography variant="h5" className="font-semibold mb-4 text-righ">
        Motivo de Anulación de la Compra
      </Typography>
      <textarea
        placeholder="Escribe el motivo de anulación aquí..."
        value={motivoAnulacion}
        onChange={(e) => setMotivoAnulacion(e.target.value)}
        className={`w-full p-4 border ${motivoAnulacion.length < 5 || motivoAnulacion.length > 30 ? 'border-red-500' : 'border-gray-300'} rounded-lg mb-4 resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition duration-200`}
        rows={4}
        required
      />
      
      {motivoAnulacion.length < 5 && (
        <p className="text-red-500 text-sm">El motivo debe tener al menos 5 letras.</p>
      )}
      {motivoAnulacion.length > 30 && (
        <p className="text-red-500 text-sm">El motivo no puede tener más de 30 letras.</p>
      )}
      <div className="flex justify-end gap-3 mt-4">
        <Button
          variant="text"
          className="btncancelarm text-white"
          size="sm"
          onClick={() => setCancelOpen(false)}
        >
          Cancelar
        </Button>
        <Button
          variant="gradient"
          className="btnagregarm bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-200"
          size="sm"
          disabled={motivoAnulacion.length < 5 || motivoAnulacion.length > 30} // Deshabilitar el botón si no cumple la validación
          onClick={handleCancelCompra}
        >
          Anular Compra
        </Button>
      </div>
    </div>
  </div>
)}

      {mostrarReporte && <ReporteCompras />}
    </>
  );
}
