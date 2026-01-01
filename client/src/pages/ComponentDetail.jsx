import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Camera, Save, ArrowLeft, Link as LinkIcon, Edit2, X, ZoomIn, Paperclip, FileText, Trash2, Plus, Minus } from 'lucide-react';
import api from '../services/api';
import CameraCapture from '../components/CameraCapture';
import { motion, AnimatePresence } from 'framer-motion';

const ComponentDetail = () => {
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();

  const sectionId = searchParams.get('section');
  const pos = searchParams.get('pos');
  const isEditModeParam = searchParams.get('edit') === 'true';

  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isEditing, setIsEditing] = useState(!id || isEditModeParam);
  
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    specification: '',
    purchase_link: '',
    custom_data: '', // Notes
    image: null,
    attachments: []
  });

  // Dynamic Sub-items State
  const [subItems, setSubItems] = useState([]);
  
  const [previewUrl, setPreviewUrl] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [existingAttachments, setExistingAttachments] = useState([]);

  useEffect(() => {
    if (id) {
      api.get(`/inventory/components/${id}`)
        .then(({ data }) => {
            setFormData({
                name: data.name,
                quantity: data.quantity,
                specification: data.specification || '',
                purchase_link: data.purchase_link || '',
                custom_data: data.custom_data?.notes || '',
                image: null,
                attachments: []
            });
            // Load sub-items from custom_data
            if (data.custom_data?.subItems && Array.isArray(data.custom_data.subItems)) {
                setSubItems(data.custom_data.subItems);
            }
            setExistingImageUrl(data.image_url);
            setExistingAttachments(data.attachments || []);
        })
        .catch(err => console.error(err));
    }
  }, [id]);

  const handleCapture = (file) => {
    setFormData({ ...formData, image: file });
    setPreviewUrl(URL.createObjectURL(file));
    setShowCamera(false);
  };

  const handleFileChange = (e, field) => {
    if (field === 'image') {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    } else if (field === 'attachments') {
        const files = Array.from(e.target.files);
        setFormData({ ...formData, attachments: [...formData.attachments, ...files] });
    }
  };

  // Sub-item handlers
  const addSubItem = () => {
    setSubItems([...subItems, { name: '', qty: 1 }]);
  };

  const removeSubItem = (index) => {
    setSubItems(subItems.filter((_, i) => i !== index));
  };

  const updateSubItem = (index, field, value) => {
    const newItems = [...subItems];
    newItems[index][field] = value;
    setSubItems(newItems);
  };

  const deleteExistingAttachment = async (attachmentId) => {
    if(!window.confirm("Remove this attachment?")) return;
    try {
        await api.delete(`/inventory/attachments/${attachmentId}`);
        setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch(err) {
        alert("Failed to delete attachment");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    if (sectionId) data.append('section_id', sectionId);
    if (pos) data.append('grid_position', pos);
    
    data.append('name', formData.name);
    data.append('quantity', formData.quantity);
    data.append('specification', formData.specification);
    data.append('purchase_link', formData.purchase_link);
    
    // Combine notes and subItems into custom_data JSON
    data.append('custom_data', JSON.stringify({ 
        notes: formData.custom_data,
        subItems: subItems
    }));
    
    if (formData.image) data.append('image', formData.image);
    
    formData.attachments.forEach(file => {
        data.append('attachments', file);
    });

    try {
      if (id) {
        await api.put(`/inventory/components/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        window.location.reload(); 
      } else {
        await api.post('/inventory/components', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        navigate(-1);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const displayImage = previewUrl || existingImageUrl;

  const openAttachment = (url, type) => {
    if (type === 'application/pdf') {
        setPdfUrl(url);
    } else {
        window.open(url, '_blank');
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-20">
      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      <AnimatePresence>
        {pdfUrl && (
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black/95 flex flex-col items-center justify-center p-2"
             >
                <div className="w-full h-full max-w-5xl flex flex-col bg-dark-800 rounded-lg overflow-hidden">
                    <div className="flex justify-between items-center p-3 border-b border-dark-700">
                        <span className="text-white font-bold ml-2">Document</span>
                        <button onClick={() => setPdfUrl(null)} className="text-white p-2 hover:bg-dark-700 rounded-lg">
                            <X size={24} />
                        </button>
                    </div>
                    <object data={pdfUrl} type="application/pdf" className="w-full h-full flex-1">
                        <p className="text-white text-center mt-10">
                            PDF Viewer not supported. <a href={pdfUrl} target="_blank" className="text-primary-500 underline">Download Here</a>
                        </p>
                    </object>
                </div>
             </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImageZoom && displayImage && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[80] bg-black flex items-center justify-center p-2"
                onClick={() => setShowImageZoom(false)}
            >
                <button className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full">
                    <X size={24} />
                </button>
                <img src={displayImage} className="max-w-full max-h-full object-contain" />
            </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-dark-800 rounded-lg hover:text-white text-gray-400">
            <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-white">
            {isEditing ? (id ? 'Edit Component' : 'Add Component') : 'Details'}
            </h1>
        </div>
        {!isEditing && (
            <button 
                onClick={() => setIsEditing(true)}
                className="p-2 bg-primary-600 rounded-lg text-white shadow-lg"
            >
                <Edit2 size={20} />
            </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Image */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div 
            className="w-full aspect-video bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden flex items-center justify-center relative group"
            onClick={() => displayImage && setShowImageZoom(true)}
          >
            {displayImage ? (
              <>
                <img src={displayImage} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <ZoomIn className="text-white" size={32} />
                </div>
              </>
            ) : (
              <span className="text-gray-600 text-xs">No Image</span>
            )}
          </div>
          
          {isEditing && (
            <div className="flex space-x-3">
                <button 
                type="button"
                onClick={() => setShowCamera(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center space-x-2 text-sm"
                >
                <Camera size={16} /> <span>Camera</span>
                </button>
                <label className="px-4 py-2 bg-dark-800 text-gray-300 rounded-lg border border-dark-700 flex items-center space-x-2 text-sm cursor-pointer hover:bg-dark-700">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'image')} />
                <span>Upload</span>
                </label>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            {isEditing ? (
                <input 
                required
                type="text" 
                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                />
            ) : (
                <div className="text-xl font-bold text-white">{formData.name}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Quantity</label>
              {isEditing ? (
                  <input 
                    type="number" 
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                  />
              ) : (
                  <div className="text-lg text-white font-mono">{formData.quantity}</div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Specifications</label>
            {isEditing ? (
                <textarea 
                className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 h-24"
                value={formData.specification}
                onChange={e => setFormData({...formData, specification: e.target.value})}
                />
            ) : (
                <div className="text-gray-300 whitespace-pre-wrap">{formData.specification || "N/A"}</div>
            )}
          </div>

          {/* Sub-Items / Contents Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm text-gray-400">Contents / Sub-items</label>
                {isEditing && (
                    <button type="button" onClick={addSubItem} className="text-xs flex items-center text-primary-400 hover:text-white">
                        <Plus size={14} className="mr-1" /> Add Item
                    </button>
                )}
            </div>
            
            <div className="space-y-2">
                {subItems.length === 0 && !isEditing && <p className="text-xs text-gray-600 italic">No sub-items listed.</p>}
                
                {subItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <input 
                                    type="text" 
                                    placeholder="Item Name"
                                    className="flex-1 bg-dark-900 border border-dark-700 rounded-lg p-2 text-sm text-white"
                                    value={item.name}
                                    onChange={(e) => updateSubItem(idx, 'name', e.target.value)}
                                />
                                <input 
                                    type="number" 
                                    placeholder="Qty"
                                    className="w-20 bg-dark-900 border border-dark-700 rounded-lg p-2 text-sm text-white text-center"
                                    value={item.qty}
                                    onChange={(e) => updateSubItem(idx, 'qty', e.target.value)}
                                />
                                <button type="button" onClick={() => removeSubItem(idx)} className="p-2 text-red-500 hover:bg-dark-800 rounded">
                                    <Trash2 size={16} />
                                </button>
                            </>
                        ) : (
                            <div className="w-full flex justify-between items-center p-2 bg-dark-800 rounded border border-dark-700">
                                <span className="text-sm text-gray-300">{item.name}</span>
                                <span className="text-xs font-mono text-primary-400">x{item.qty}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
          </div>

          {/* Attachments Section */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Attachments</label>
            
            <div className="space-y-2 mb-3">
                {existingAttachments.map(att => (
                    <div key={att.id} className="flex items-center space-x-3 p-3 bg-dark-800 rounded-lg border border-dark-700">
                        <div onClick={() => openAttachment(att.file_path, att.file_type)} className="flex-1 flex items-center space-x-3 cursor-pointer">
                            <FileText size={20} className="text-primary-400" />
                            <span className="text-sm text-white truncate">
                                {att.file_path.split('/').pop()}
                            </span>
                        </div>
                        {isEditing && (
                            <button type="button" onClick={() => deleteExistingAttachment(att.id)} className="text-red-500 p-2 hover:bg-dark-900 rounded-lg">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
                
                {formData.attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-3 bg-dark-800/50 border border-dashed border-dark-600 rounded-lg">
                        <Paperclip size={20} className="text-gray-500" />
                        <span className="text-sm text-gray-300 truncate flex-1">{file.name}</span>
                        <button type="button" onClick={() => {
                             const newAtt = formData.attachments.filter((_, i) => i !== idx);
                             setFormData({...formData, attachments: newAtt});
                        }} className="text-red-400"><X size={16} /></button>
                    </div>
                ))}
            </div>

            {isEditing && (
                 <label className="flex items-center justify-center space-x-2 w-full p-3 border border-dashed border-dark-600 rounded-lg cursor-pointer hover:bg-dark-800 transition-colors">
                    <Paperclip size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-400">Add Attachments (PDF/Img)</span>
                    <input type="file" multiple accept=".pdf,image/*" className="hidden" onChange={(e) => handleFileChange(e, 'attachments')} />
                 </label>
            )}
          </div>

          {formData.purchase_link && (
            <div>
                <label className="block text-sm text-gray-400 mb-1">Link</label>
                {isEditing ? (
                    <input 
                    type="url" 
                    className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-white"
                    value={formData.purchase_link}
                    onChange={e => setFormData({...formData, purchase_link: e.target.value})}
                    />
                ) : (
                    <a href={formData.purchase_link} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline flex items-center space-x-1">
                        <LinkIcon size={14} /> <span>Open Link</span>
                    </a>
                )}
            </div>
          )}
        </div>

        {isEditing && (
            <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-600/20 flex items-center justify-center space-x-2"
            >
            {loading ? 'Saving...' : <><Save size={20} /><span>Save Changes</span></>}
            </button>
        )}
      </form>
    </div>
  );
};

export default ComponentDetail;