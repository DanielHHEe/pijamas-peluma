import { useState, useEffect, createContext, useContext } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, Moon, ChevronLeft, ChevronRight, Package, MapPin, User, Home, Building, Send, Check } from 'lucide-react';
import { listarProdutos } from './services/api';

// --- Cart Context ---
const CartContext = createContext();
const useCart = () => useContext(CartContext);

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product, tamanhoSelecionado, quantidade = 1) => {
    setCart((prev) => {
      const itemKey = `${product._id}_${tamanhoSelecionado}`;
      const existing = prev.find((item) => item.key === itemKey);
      
      if (existing) {
        return prev.map((item) =>
          item.key === itemKey
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      }
      
      // Para produtos com estoque por tamanho
      const estoqueAtual = product.estoque?.[tamanhoSelecionado] || 
                          product.estoque?.UNICO || 
                          product.estoque?.total || 
                          product.estoque || 
                          0;
      
      return [...prev, { 
        ...product, 
        key: itemKey,
        quantidade,
        tamanhoSelecionado,
        estoqueAtual: Number(estoqueAtual) || 0
      }];
    });
  };

  const removeFromCart = (itemKey) => {
    setCart((prev) => prev.filter((item) => item.key !== itemKey));
  };

  const updateQuantity = (itemKey, quantidade) => {
    if (quantidade <= 0) {
      removeFromCart(itemKey);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.key === itemKey ? { ...item, quantidade } : item
      )
    );
  };

  const clearCart = () => setCart([]);
  const total = cart.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      total, 
      totalItems 
    }}>
      {children}
    </CartContext.Provider>
  );
};

// --- Header Component ---
const Header = ({ onCartClick }) => {
  const { totalItems } = useCart();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const headerStyle = {
    padding: isMobile ? '8px 0' : '10px 0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
    borderBottom: '1px solid rgba(0,0,0,0.05)'
  };

  const headerContentStyle = {
    width: '100%',
    maxWidth: '1280px',
    padding: isMobile ? '0 12px' : '0 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxSizing: 'border-box'
  };

  const logoImageStyle = {
    height: isMobile ? '80px' : '100px',
    borderRadius: '12px',
    objectFit: 'contain'
  };

  const cartButtonStyle = {
    background: '#DAC8B3',
    border: 'none',
    color: '#1e293b',
    borderRadius: '9999px',
    padding: isMobile ? '8px 16px' : '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontSize: isMobile ? '14px' : '16px'
  };

  const badgeStyle = {
    background: '#22c55e',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    borderRadius: '9999px',
    minWidth: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px'
  };

  return (
    <header style={headerStyle}>
      <div style={headerContentStyle}>
        <img 
          src="/peluma.png" 
          alt="Peluma Logo" 
          style={logoImageStyle}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        
        <button
          onClick={onCartClick}
          style={cartButtonStyle}
        >
          <ShoppingCart size={isMobile ? 18 : 20} />
          <span>Carrinho</span>
          {totalItems > 0 && (
            <span style={badgeStyle}>{totalItems}</span>
          )}
        </button>
      </div>
    </header>
  );
};

// --- Product Modal Component COM SELEÇÃO DE TAMANHO ---
const ProductModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [added, setAdded] = useState(false);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen || !product) return null;

  const images = product.imagens && product.imagens.length > 0 ? product.imagens : [];
  const hasMultipleImages = images.length > 1;

  // Determinar tamanhos disponíveis
  const getTamanhosDisponiveis = () => {
    if (!product.estoque || typeof product.estoque !== 'object') {
      return ['UNICO'];
    }
    
    const estoqueObj = product.estoque;
    const tamanhos = Object.keys(estoqueObj);
    
    // Se for produto Adulto com tamanhos específicos
    if (product.tipo === 'Adulto' && 
        Array.isArray(product.tamanho) && 
        product.tamanho.length > 0 && 
        product.tamanho[0] !== "N/A") {
      
      return product.tamanho.filter(tam => 
        Number(estoqueObj[tam] || estoqueObj.UNICO || 0) > 0
      );
    }
    
    // Para outros produtos, mostrar tamanhos com estoque > 0
    return tamanhos.filter(tam => Number(estoqueObj[tam]) > 0);
  };

  const tamanhosDisponiveis = getTamanhosDisponiveis();
  
  // Estoque atual para o tamanho selecionado
  const estoqueAtual = tamanhoSelecionado 
    ? Number(product.estoque?.[tamanhoSelecionado] || 0)
    : 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && hasMultipleImages) nextImage();
    if (isRightSwipe && hasMultipleImages) prevImage();
  };

  const handleAddToCart = () => {
    if (!tamanhoSelecionado && tamanhosDisponiveis.length > 0) {
      return;
    }
    
    const tamanhoFinal = tamanhoSelecionado || 'UNICO';
    onAddToCart(product, tamanhoFinal, quantidade);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
      setTamanhoSelecionado('');
      setQuantidade(1);
    }, 800);
  };

  const handleQuantidadeChange = (delta) => {
    const novaQuantidade = quantidade + delta;
    if (novaQuantidade >= 1 && novaQuantidade <= estoqueAtual) {
      setQuantidade(novaQuantidade);
    }
  };

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: isMobile ? '8px' : '16px',
    boxSizing: 'border-box'
  };

  const modalStyle = {
    background: 'white',
    borderRadius: isMobile ? '20px' : '24px',
    width: '100%',
    maxWidth: isMobile ? '100%' : '512px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  };

  const imageContainerStyle = {
    position: 'relative',
    background: 'linear-gradient(to bottom right, #f1f5f9, #f8fafc)',
    width: '100%',
    paddingTop: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box'
  };

  const imageWrapperStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: isMobile ? '12px' : '16px',
    right: isMobile ? '12px' : '16px',
    zIndex: 10,
    width: isMobile ? '36px' : '40px',
    height: isMobile ? '36px' : '40px',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(4px)',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    border: 'none',
    cursor: 'pointer'
  };

  const navButtonStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: isMobile ? '36px' : '40px',
    height: isMobile ? '36px' : '40px',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(4px)',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    border: 'none',
    cursor: 'pointer',
    zIndex: 5
  };

  const imageStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    display: 'block'
  };

  const dotsContainerStyle = {
    position: 'absolute',
    bottom: isMobile ? '12px' : '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
    zIndex: 5
  };

  const infoContainerStyle = {
    padding: isMobile ? '20px' : '24px',
    overflow: 'auto',
    flex: 1,
    boxSizing: 'border-box'
  };

  const headerInfoStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: isMobile ? '12px' : '16px',
    marginBottom: isMobile ? '12px' : '16px'
  };

  const titleStyle = {
    fontSize: isMobile ? '18px' : '20px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    flex: 1,
    lineHeight: 1.3
  };

  const priceStyle = {
    fontSize: isMobile ? '20px' : '22px',
    fontWeight: 'bold',
    color: 'rgb(15, 190, 64)',
    whiteSpace: 'nowrap'
  };

  const tagsContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: isMobile ? '6px' : '8px',
    marginBottom: isMobile ? '12px' : '16px'
  };

  const tamanhosContainerStyle = {
    marginBottom: isMobile ? '12px' : '16px'
  };

  const tamanhosLabelStyle = {
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: isMobile ? '6px' : '8px'
  };

  const tamanhosGridStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: isMobile ? '6px' : '8px'
  };

  const tamanhoButtonStyle = (tamanho) => ({
    padding: isMobile ? '10px 14px' : '8px 16px',
    borderRadius: '8px',
    border: '1px solid',
    background: tamanhoSelecionado === tamanho ? '#9333ea' : 'transparent',
    color: tamanhoSelecionado === tamanho ? 'white' : '#475569',
    borderColor: tamanhoSelecionado === tamanho ? '#9333ea' : '#e2e8f0',
    cursor: 'pointer',
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    minWidth: isMobile ? '50px' : '60px',
    textAlign: 'center',
    flex: '1 0 auto'
  });

  const quantidadeContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '16px' : '12px',
    marginBottom: isMobile ? '20px' : '24px',
    justifyContent: 'center'
  };

  const quantidadeButtonStyle = {
    width: isMobile ? '44px' : '40px',
    height: isMobile ? '44px' : '40px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  };

  const quantidadeValueStyle = {
    fontSize: isMobile ? '20px' : '18px',
    fontWeight: 'bold',
    minWidth: '40px',
    textAlign: 'center'
  };

  const estoqueInfoStyle = {
    fontSize: isMobile ? '13px' : '14px',
    color: '#64748b',
    textAlign: 'center',
    marginTop: isMobile ? '6px' : '8px'
  };

  const descriptionStyle = {
    color: '#64748b',
    fontSize: isMobile ? '13px' : '14px',
    marginBottom: isMobile ? '20px' : '24px',
    lineHeight: '1.6'
  };

  const getButtonStyle = () => {
    const tamanhoObrigatorio = tamanhosDisponiveis.length > 0;
    const podeAdicionar = !tamanhoObrigatorio || tamanhoSelecionado;
    const estoqueSuficiente = quantidade <= estoqueAtual;

    if (added) {
      return {
        width: '100%',
        padding: isMobile ? '14px' : '16px',
        borderRadius: '16px',
        fontWeight: 'bold',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: '#22c55e',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
        fontSize: isMobile ? '15px' : '16px'
      };
    }
    if (!podeAdicionar || !estoqueSuficiente || estoqueAtual === 0) {
      return {
        width: '100%',
        padding: isMobile ? '14px' : '16px',
        borderRadius: '16px',
        fontWeight: 'bold',
        color: '#64748b',
        border: 'none',
        cursor: 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: '#e2e8f0',
        opacity: 0.7,
        boxSizing: 'border-box',
        fontSize: isMobile ? '15px' : '16px'
      };
    }
    return {
      width: '100%',
      padding: isMobile ? '14px' : '16px',
      borderRadius: '16px',
      fontWeight: 'bold',
      color: '#1e293b',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      background: '#DAC8B3',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box',
      fontSize: isMobile ? '15px' : '16px'
    };
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={imageContainerStyle}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div style={imageWrapperStyle}>
            <button onClick={onClose} style={closeButtonStyle}>
              <X size={isMobile ? 18 : 20} color="#475569" />
            </button>

            {images.length > 0 ? (
              <img src={images[currentImageIndex]} alt={product.nome} style={imageStyle} />
            ) : (
              <Package size={isMobile ? 48 : 64} color="#cbd5e1" />
            )}

            {hasMultipleImages && (
              <>
                <button onClick={prevImage} style={{ ...navButtonStyle, left: isMobile ? '8px' : '12px' }}>
                  <ChevronLeft size={isMobile ? 18 : 20} color="#475569" />
                </button>
                <button onClick={nextImage} style={{ ...navButtonStyle, right: isMobile ? '8px' : '12px' }}>
                  <ChevronRight size={isMobile ? 18 : 20} color="#475569" />
                </button>
              </>
            )}

            {hasMultipleImages && (
              <div style={dotsContainerStyle}>
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    style={{
                      height: '8px',
                      borderRadius: '9999px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      width: index === currentImageIndex ? '24px' : '8px',
                      background: index === currentImageIndex ? '#9333ea' : '#cbd5e1'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={infoContainerStyle}>
          <div style={headerInfoStyle}>
            <h2 style={titleStyle}>{product.nome}</h2>
            <span style={priceStyle}>R$ {product.preco?.toFixed(2)}</span>
          </div>

          <div style={tagsContainerStyle}>
            {product.tipo && (
              <span style={{
                padding: isMobile ? '4px 10px' : '4px 12px',
                borderRadius: '9999px',
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: '600',
                background: product.tipo === 'adulto' || product.tipo === 'Adulto' ? '#f3e8ff' : '#fce7f3',
                color: product.tipo === 'adulto' || product.tipo === 'Adulto' ? '#7c3aed' : '#db2777'
              }}>
                {product.tipo === 'adulto' || product.tipo === 'Adulto' ? 'Adulto' : 'Infantil'}
              </span>
            )}
          </div>

          {tamanhosDisponiveis.length > 0 && (
            <div style={tamanhosContainerStyle}>
              <div style={tamanhosLabelStyle}>Selecione o tamanho:</div>
              <div style={tamanhosGridStyle}>
                {tamanhosDisponiveis.map((tamanho) => (
                  <button
                    key={tamanho}
                    onClick={() => setTamanhoSelecionado(tamanho)}
                    style={tamanhoButtonStyle(tamanho)}
                  >
                    {tamanho === 'UNICO' ? 'Único' : tamanho}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={quantidadeContainerStyle}>
            <button
              onClick={() => handleQuantidadeChange(-1)}
              disabled={quantidade <= 1}
              style={{
                ...quantidadeButtonStyle,
                opacity: quantidade <= 1 ? 0.5 : 1,
                cursor: quantidade <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <Minus size={isMobile ? 20 : 18} />
            </button>
            <span style={quantidadeValueStyle}>{quantidade}</span>
            <button
              onClick={() => handleQuantidadeChange(1)}
              disabled={quantidade >= estoqueAtual}
              style={{
                ...quantidadeButtonStyle,
                opacity: quantidade >= estoqueAtual ? 0.5 : 1,
                cursor: quantidade >= estoqueAtual ? 'not-allowed' : 'pointer'
              }}
            >
              <Plus size={isMobile ? 20 : 18} />
            </button>
          </div>

          {tamanhoSelecionado && (
            <div style={estoqueInfoStyle}>
              Estoque disponível: {estoqueAtual} unidades
            </div>
          )}

          {product.descricao && (
            <p style={descriptionStyle}>{product.descricao}</p>
          )}

          <button
            onClick={handleAddToCart}
            disabled={
              (tamanhosDisponiveis.length > 0 && !tamanhoSelecionado) || 
              estoqueAtual === 0 || 
              quantidade > estoqueAtual
            }
            style={getButtonStyle()}
          >
            {added ? (
              <>
                <Check size={isMobile ? 18 : 20} />
                Adicionado!
              </>
            ) : (
              <>
                <ShoppingCart size={isMobile ? 18 : 20} />
                {estoqueAtual === 0 ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Product Card Component ---
const ProductCard = ({ product, onProductClick }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calcular estoque total do produto
  const calcularEstoqueTotal = () => {
    if (!product.estoque || typeof product.estoque !== 'object') {
      return Number(product.estoque) || 0;
    }
    
    const estoqueObj = product.estoque;
    return Object.values(estoqueObj).reduce((sum, val) => sum + (Number(val) || 0), 0);
  };

  const estoqueTotal = calcularEstoqueTotal();
  const esgotado = estoqueTotal === 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (esgotado) return;
    
    // Para produtos com tamanhos específicos, abre o modal
    if (product.tipo === 'Adulto' && 
        Array.isArray(product.tamanho) && 
        product.tamanho.length > 0 && 
        product.tamanho[0] !== "N/A") {
      onProductClick(product);
      return;
    }
    
    // Para produtos sem tamanhos, adiciona direto com tamanho UNICO
    addToCart(product, 'UNICO', 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const cardStyle = {
    background: 'white',
    borderRadius: isMobile ? '12px' : '14px',
    overflow: 'hidden',
    boxShadow: isHovered ? '0 17px 21px -4px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    border: isHovered ? '1px solid #e9d5ff' : '1px solid #f1f5f9',
    transition: 'all 0.5s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transform: isMobile ? 'scale(1)' : 'scale(0.85)',
    transformOrigin: 'center center'
  };

  const imageContainerStyle = {
    aspectRatio: '3/4',
    background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0
  };

  const imageStyle = {
    width: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    padding: '0px',
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
    transition: 'transform 0.5s ease'
  };

  const soldOutBadgeStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-15deg)',
    background: 'rgba(0,0,0,0.85)',
    color: 'white',
    fontSize: isMobile ? '12px' : '14px',
    fontWeight: 'bold',
    padding: isMobile ? '6px 16px' : '8px 20px',
    borderRadius: '4px',
    letterSpacing: '2px',
    zIndex: 5,
    textTransform: 'uppercase',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  };

  const photoBadgeStyle = {
    position: 'absolute',
    top: isMobile ? '8px' : '10px',
    left: isMobile ? '8px' : '10px',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    color: 'white',
    fontSize: isMobile ? '9px' : '10px',
    padding: isMobile ? '2px 6px' : '3px 7px',
    borderRadius: '9999px',
    zIndex: 2
  };

  const infoStyle = {
    padding: isMobile ? '14px' : '17px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  };

  const tagsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: isMobile ? '4px' : '5px',
    marginBottom: isMobile ? '8px' : '10px'
  };

  const titleStyle = {
    fontWeight: '600',
    fontFamily: "'Inter', sans-serif",
    color: '#1e293b',
    marginBottom: isMobile ? '6px' : '7px',
    fontSize: isMobile ? '13px' : '15px',
    minHeight: '8px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    flex: 1,
    lineHeight: 1.3
  };

  const footerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: isMobile ? '3px' : '4px',
    borderTop: '1px solid #f1f5f9'
  };

  const priceStyle = {
    fontSize: isMobile ? '18px' : '22px',
    fontWeight: 'bold',
    color: '#0fbe40ff'
  };

  const getAddButtonStyle = () => {
    if (added) {
      return {
        width: isMobile ? '36px' : '34px',
        height: isMobile ? '36px' : '34px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: 'pointer',
        background: '#22c55e',
        color: 'white',
        transition: 'all 0.3s ease'
      };
    }
    if (esgotado) {
      return {
        width: isMobile ? '36px' : '34px',
        height: isMobile ? '36px' : '34px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        cursor: 'not-allowed',
        background: '#e2e8f0',
        color: '#94a3b8',
        opacity: 0.6
      };
    }
    return {
      width: isMobile ? '36px' : '34px',
      height: isMobile ? '36px' : '34px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      cursor: 'pointer',
      background: '#DAC8B3',
      color: '#1e293b',
      transition: 'all 0.3s ease'
    };
  };

  return (
    <div
      onClick={() => onProductClick(product)}
      style={cardStyle}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onTouchStart={() => isMobile && setIsHovered(true)}
      onTouchEnd={() => isMobile && setIsHovered(false)}
    >
      <div style={imageContainerStyle}>
        {product.imagens && product.imagens.length > 0 ? (
          <img src={product.imagens[0]} alt={product.nome} style={imageStyle} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={isMobile ? 40 : 54} color="#cbd5e1" />
          </div>
        )}
        
        {esgotado && (
          <div style={soldOutBadgeStyle}>ESGOTADO</div>
        )}
        
        {product.imagens && product.imagens.length > 1 && (
          <span style={photoBadgeStyle}>+{product.imagens.length - 1} fotos</span>
        )}
      </div>

      <div style={infoStyle}>
        <div style={tagsStyle}>
          {product.tipo && (
            <span style={{
              padding: isMobile ? '2px 6px' : '2px 7px',
              borderRadius: '9999px',
              fontSize: isMobile ? '8px' : '9px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: product.tipo === 'adulto' || product.tipo === 'Adulto' ? '#f3e8ff' : '#fce7f3',
              color: product.tipo === 'adulto' || product.tipo === 'Adulto' ? '#7c3aed' : '#db2777'
            }}>
              {product.tipo === 'adulto' || product.tipo === 'Adulto' ? 'Adulto' : 'Infantil'}
            </span>
          )}
        </div>

        <h3 style={titleStyle}>{product.nome}</h3>

        <div style={footerStyle}>
          <span style={priceStyle}>R$ {product.preco?.toFixed(2)}</span>
          <button
            onClick={handleAdd}
            disabled={esgotado}
            style={getAddButtonStyle()}
          >
            {added ? <Check size={isMobile ? 16 : 17} /> : <Plus size={isMobile ? 16 : 17} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Cart Modal Component ---
const CartModal = ({ isOpen, onClose, onCheckout }) => {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: isMobile ? '12px' : '16px'
  };

  const modalStyle = {
    background: 'white',
    borderRadius: isMobile ? '20px' : '24px',
    width: '100%',
    maxWidth: '448px',
    maxHeight: '85vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    padding: isMobile ? '20px' : '24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const headerLeftStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const iconContainerStyle = {
    width: isMobile ? '36px' : '40px',
    height: isMobile ? '36px' : '40px',
    background: '#f3e8ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const titleStyle = {
    fontSize: isMobile ? '18px' : '20px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0
  };

  const closeButtonStyle = {
    width: isMobile ? '36px' : '40px',
    height: isMobile ? '36px' : '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer'
  };

  const contentStyle = {
    flex: 1,
    overflow: 'auto',
    padding: isMobile ? '12px' : '16px'
  };

  const emptyStyle = {
    textAlign: 'center',
    padding: '64px 0'
  };

  const emptyIconStyle = {
    width: '80px',
    height: '80px',
    background: '#f1f5f9',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  };

  const itemsContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const itemStyle = {
    display: 'flex',
    gap: '10px',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '14px',
    alignItems: 'center',
    flexWrap: 'nowrap'
  };

  const itemImageStyle = {
    width: isMobile ? '60px' : '50px',
    height: isMobile ? '60px' : '50px',
    background: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    flexShrink: 0
  };

  const footerStyle = {
    padding: isMobile ? '20px' : '24px',
    background: '#f8fafc',
    borderTop: '1px solid #f1f5f9'
  };

  const totalRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  };

  const checkoutButtonStyle = {
    width: '100%',
    background: '#DAC8B3',
    color: '#1e293b',
    padding: isMobile ? '14px' : '16px',
    borderRadius: '16px',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    fontSize: isMobile ? '15px' : '16px'
  };

  // Tamanhos responsivos para mobile
  const quantityButtonSize = isMobile ? '36px' : '26px';
  const quantityIconSize = isMobile ? '18px' : '14px';
  const trashButtonSize = isMobile ? '36px' : '26px';
  const trashIconSize = isMobile ? '18px' : '14px';

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={headerLeftStyle}>
            <div style={iconContainerStyle}>
              <ShoppingCart size={isMobile ? 18 : 20} color="#9333ea" />
            </div>
            <h2 style={titleStyle}>Seu Carrinho</h2>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>
            <X size={isMobile ? 18 : 20} color="#94a3b8" />
          </button>
        </div>

        <div style={contentStyle}>
          {cart.length === 0 ? (
            <div style={emptyStyle}>
              <div style={emptyIconStyle}>
                <ShoppingCart size={32} color="#cbd5e1" />
              </div>
              <p style={{ color: '#94a3b8', fontWeight: '500', margin: 0 }}>Seu carrinho está vazio</p>
            </div>
          ) : (
            <div style={itemsContainerStyle}>
              {cart.map((item) => (
                <div key={item.key} style={itemStyle}>
                  <div style={itemImageStyle}>
                    {item.imagens?.[0] ? (
                      <img src={item.imagens[0]} alt={item.nome} style={{ width: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package size={20} color="#cbd5e1" />
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h4 style={{ 
                      fontWeight: '600', 
                      color: '#1e293b', 
                      fontSize: isMobile ? '14px' : '13px', 
                      margin: 0, 
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal',
                      lineHeight: '1.2',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>{item.nome}</h4>
                    
                    {item.tamanhoSelecionado && item.tamanhoSelecionado !== 'UNICO' && (
                      <span style={{ 
                        fontSize: isMobile ? '12px' : '11px', 
                        color: '#64748b', 
                        background: '#f1f5f9', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        alignSelf: 'flex-start',
                        marginBottom: '2px'
                      }}>
                        Tamanho: {item.tamanhoSelecionado}
                      </span>
                    )}
                    
                    <p style={{ color: 'rgb(15, 190, 64)', fontWeight: 'bold', margin: 0, fontSize: isMobile ? '14px' : '13px' }}>R$ {item.preco?.toFixed(2)}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button
                      onClick={() => updateQuantity(item.key, item.quantidade - 1)}
                      style={{
                        width: quantityButtonSize,
                        height: quantityButtonSize,
                        borderRadius: '8px',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Minus size={quantityIconSize} color="#475569" />
                    </button>
                    <span style={{ width: '24px', textAlign: 'center', fontWeight: 'bold', color: '#1e293b', fontSize: isMobile ? '15px' : '14px' }}>{item.quantidade}</span>
                    <button
                      onClick={() => updateQuantity(item.key, item.quantidade + 1)}
                      style={{
                        width: quantityButtonSize,
                        height: quantityButtonSize,
                        borderRadius: '8px',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={quantityIconSize} color="#475569" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.key)}
                    style={{
                      width: trashButtonSize,
                      height: trashButtonSize,
                      borderRadius: '8px',
                      background: '#fef2f2',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <Trash2 size={trashIconSize} color="#ef4444" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div style={footerStyle}>
            <div style={totalRowStyle}>
              <span style={{ color: '#475569', fontWeight: '500', fontSize: isMobile ? '16px' : 'inherit' }}>Total</span>
              <span style={{ fontSize: isMobile ? '22px' : '24px', fontWeight: 'bold', color: 'rgb(15, 190, 64)' }}>R$ {total.toFixed(2)}</span>
            </div>
            <button onClick={onCheckout} style={checkoutButtonStyle}>
              <Send size={isMobile ? 18 : 20} />
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Checkout Modal Component ---
const CheckoutModal = ({ isOpen, onClose }) => {
  const { cart, total, clearCart } = useCart();
  const [formData, setFormData] = useState({
    nome: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const WHATSAPP_NUMBER = '5563984011186';

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format products with sizes
    const produtos = cart
      .map((item) => {
        const tamanhoInfo = item.tamanhoSelecionado && item.tamanhoSelecionado !== 'UNICO' 
          ? ` (Tamanho: ${item.tamanhoSelecionado})` 
          : '';
        return `• ${item.nome}${tamanhoInfo} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2)}`;
      })
      .join('\n');
    
    const mensagem = `*NOVO PEDIDO - Peluma Pijamas*\n\n*Cliente:* ${formData.nome}\n*Endereço:* ${formData.rua}, ${formData.numero} - ${formData.bairro}, ${formData.cidade}\n\n*Produtos:*\n${produtos}\n\n*Total:* R$ ${total.toFixed(2)}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`, '_blank');
    clearCart();
    onClose();
    setFormData({ nome: '', rua: '', numero: '', bairro: '', cidade: '' });
  };

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100,
    padding: isMobile ? '12px' : '16px'
  };

  const modalStyle = {
    background: 'white',
    borderRadius: isMobile ? '20px' : '24px',
    width: '100%',
    maxWidth: '448px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
  };

  const headerStyle = {
    padding: isMobile ? '20px' : '24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const inputContainerStyle = {
    position: 'relative'
  };

  const iconStyle = {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    color: '#94a3b8',
    pointerEvents: 'none'
  };

  const inputStyle = {
    width: '100%',
    paddingLeft: '48px',
    paddingRight: '16px',
    paddingTop: '16px',
    paddingBottom: '16px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    color: '#1e293b',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
    appearance: 'none',
    WebkitTextSizeAdjust: '100%'
  };

  const inputSimpleStyle = {
    width: '100%',
    padding: '16px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    color: '#1e293b',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
    appearance: 'none',
    WebkitTextSizeAdjust: '100%'
  };

  const submitButtonStyle = {
    width: '100%',
    background: '#DAC8B3',
    color: '#1e293b',
    padding: isMobile ? '14px' : '16px',
    borderRadius: '16px',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '24px',
    fontSize: isMobile ? '15px' : '16px'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#f3e8ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={20} color="#9333ea" />
            </div>
            <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Dados de Entrega</h2>
          </div>
          <button
            onClick={onClose}
            style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <X size={20} color="#94a3b8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '20px' : '24px', display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
          <div style={inputContainerStyle}>
            <User style={iconStyle} />
            <input
              type="text"
              placeholder="Nome Completo"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={inputContainerStyle}>
            <Home style={iconStyle} />
            <input
              type="text"
              placeholder="Rua"
              required
              value={formData.rua}
              onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '8px' : '12px' }}>
            <input
              type="text"
              placeholder="Número"
              required
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              style={inputSimpleStyle}
            />
            <input
              type="text"
              placeholder="Bairro"
              required
              value={formData.bairro}
              onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
              style={inputSimpleStyle}
            />
          </div>

          <div style={inputContainerStyle}>
            <Building style={iconStyle} />
            <input
              type="text"
              placeholder="Cidade"
              required
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              style={inputStyle}
            />
          </div>

          <button type="submit" style={submitButtonStyle}>
            <Send size={isMobile ? 18 : 20} />
            Enviar pelo WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
};

// --- App Content (inside CartProvider) ---
const AppContent = ({ products, loading, cartOpen, setCartOpen, checkoutOpen, setCheckoutOpen, selectedProduct, setSelectedProduct }) => {
  const { addToCart } = useCart();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
    display: 'flex',
    flexDirection: 'column'
  };

  const mainStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: isMobile ? '20px 12px' : '32px 16px',
    flex: 1,
    width: '100%',
    boxSizing: 'border-box'
  };

  const loadingStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0'
  };

  const spinnerStyle = {
    width: '48px',
    height: '48px',
    border: '4px solid #e9d5ff',
    borderTop: '4px solid #9333ea',
    borderRadius: '9999px',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
    justifyItems: 'center'
  };

  const footerStyle = {
    background: '#0f172a',
    color: 'white',
    padding: isMobile ? '32px 20px' : '48px 32px',
    marginTop: 'auto'
  };

  const footerContentStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    textAlign: 'center'
  };

  const footerLogoStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '20px'
  };

  const footerQuoteStyle = {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontStyle: 'italic',
    fontSize: isMobile ? '16px' : '18px',
    color: '#e2e8f0',
    marginBottom: '24px',
    letterSpacing: '0.5px',
    lineHeight: 1.4
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .grid-container {
            grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)) !important;
            gap: 8px !important;
          }
        }
        @media (max-width: 480px) {
          .grid-container {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6px !important;
          }
        }
        @media (max-width: 360px) {
          .grid-container {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 4px !important;
          }
        }
        /* Prevent zoom on iOS inputs */
        @supports (-webkit-touch-callout: none) {
          input, textarea, select {
            font-size: 16px !important;
          }
        }
      `}</style>
      
      <Header onCartClick={() => setCartOpen(true)} />

      <main style={mainStyle}>
        {loading ? (
          <div style={loadingStyle}>
            <div style={spinnerStyle} />
            <p style={{ color: '#94a3b8' }}>Carregando produtos...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Package size={64} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#94a3b8' }}>Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid-container" style={gridStyle}>
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onProductClick={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </main>

      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <div style={footerLogoStyle}>
            <Moon size={isMobile ? 20 : 24} color="#c084fc" />
            <span style={{ fontWeight: 'bold', fontSize: isMobile ? '16px' : '18px' }}>Peluma Pijamas</span>
          </div>
          <p style={footerQuoteStyle}>
            "Sua paz em forma de pijama"
          </p>
          <p style={{ color: '#64748b', fontSize: isMobile ? '13px' : '14px', margin: 0 }}>
            © 2026 Todos os direitos reservados
          </p>
        </div>
      </footer>

      <CartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />
      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
};

// --- Main App Component ---
function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        setLoading(true);
        const data = await listarProdutos();
        
        // Formatar produtos para lidar com estoque por tamanho
        const produtosFormatados = data.map(p => ({
          ...p,
          // Garantir que estoque seja sempre objeto
          estoque: typeof p.estoque === 'object' ? p.estoque : 
                   typeof p.estoque === 'number' ? { UNICO: p.estoque } : 
                   { UNICO: 0 }
        }));
        
        setProducts(produtosFormatados);
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
      } finally {
        setLoading(false);
      }
    };
    
    carregarProdutos();
  }, []);

  return (
    <CartProvider>
      <AppContent 
        products={products}
        loading={loading}
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        checkoutOpen={checkoutOpen}
        setCheckoutOpen={setCheckoutOpen}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
      />
    </CartProvider>
  );
}

export default App;