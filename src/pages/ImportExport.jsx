import React, { useState } from 'react';
import { FaFileImport, FaFileExport, FaFileCsv, FaFileExcel, FaCloudUploadAlt } from 'react-icons/fa';

const ImportExport = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleImport = () => {
    if (selectedFile) {
      // Logique d'importation ici
      alert(`Fichier sélectionné : ${selectedFile.name}`);
    } else {
      alert('Veuillez sélectionner un fichier');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#333]">Importation et Exportation</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section Importation */}
        <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-6">
          <h2 className="text-xl font-semibold text-[#333] mb-4 flex items-center">
            <FaFileImport className="mr-2 text-[#0056B3]" />
            Importation des Données
          </h2>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#E0E0E0] rounded-lg p-6 text-center hover:bg-[#F8F9FA] transition-colors">
              <FaCloudUploadAlt className="w-12 h-12 text-[#666] mx-auto" />
              <p className="text-[#666] mt-2">Glissez-déposez un fichier ou</p>
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-[#0056B3] font-medium hover:underline">
                  Parcourir vos fichiers
                </span>
              </label>
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                accept=".csv, .xlsx"
              />
              {selectedFile && (
                <p className="text-sm text-[#333] mt-2">
                  Fichier sélectionné : {selectedFile.name}
                </p>
              )}
            </div>

            <button 
              onClick={handleImport}
              className="w-full bg-[#0056B3] text-white px-6 py-3 rounded-lg hover:bg-[#004499] transition flex items-center justify-center"
            >
              <FaFileCsv className="mr-2" />
              Importer les Données
            </button>

            <p className="text-sm text-[#666]">
              Formats supportés : CSV, Excel (XLSX)
            </p>
          </div>
        </div>

        {/* Section Exportation */}
        <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-6">
          <h2 className="text-xl font-semibold text-[#333] mb-4 flex items-center">
            <FaFileExport className="mr-2 text-[#28A745]" />
            Exportation des Données
          </h2>

          <div className="space-y-4">
            <button 
              className="w-full bg-[#28A745] text-white px-6 py-3 rounded-lg hover:bg-[#218838] transition flex items-center justify-center"
            >
              <FaFileCsv className="mr-2" />
              Exporter en CSV
            </button>

            <button 
              className="w-full bg-[#28A745] text-white px-6 py-3 rounded-lg hover:bg-[#218838] transition flex items-center justify-center"
            >
              <FaFileExcel className="mr-2" />
              Exporter en Excel
            </button>

            <p className="text-sm text-[#666]">
              Les données seront exportées dans le format sélectionné
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-xl shadow-lg border border-[#E0E0E0] p-6">
        <h3 className="text-lg font-semibold text-[#333] mb-4">Instructions</h3>
        <div className="space-y-2 text-[#666]">
          <p>1. Pour l'importation, assurez-vous que votre fichier respecte le format requis.</p>
          <p>2. Les colonnes obligatoires doivent être présentes dans le fichier.</p>
          <p>3. L'exportation génère un fichier contenant toutes les données actuelles.</p>
          <p>4. Vous pouvez choisir entre les formats CSV et Excel pour l'export.</p>
        </div>
      </div>
    </div>
  );
};

export default ImportExport;