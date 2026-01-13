import { useState, useEffect, createContext, useContext } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, Moon, ChevronLeft, ChevronRight, Package, MapPin, User, Home, Building, Send, Check } from 'lucide-react';
import { listarProdutos } from './services/api';

// --- Cart Context ---
const CartContext = createContext();
const useCart = () => useContext(CartContext);

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantidade: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item._id !== productId));
  };

  const updateQuantity = (productId, quantidade) => {
    if (quantidade <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item._id === productId ? { ...item, quantidade } : item
      )
    );
  };

  const clearCart = () => setCart([]);
  const total = cart.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

// --- Header Component ---
const Header = ({ onCartClick }) => {
  const { totalItems } = useCart();

  const headerStyle = {
    padding: '10px 0',
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
    padding: '0 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxSizing: 'border-box'
  };

  const logoImageStyle = {
    height: '80px',
    borderRadius: '12px',
    objectFit: 'contain'
  };

  const cartButtonStyle = {
    background: '#DAC8B3',
    border: 'none',
    color: '#1e293b',
    borderRadius: '9999px',
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  };

  const badgeStyle = {
    background: '#22c55e',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    borderRadius: '9999px',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
          <ShoppingCart style={{ width: '20px', height: '20px' }} />
          <span>Carrinho</span>
          {totalItems > 0 && (
            <span style={badgeStyle}>{totalItems}</span>
          )}
        </button>
      </div>
    </header>
  );
};

// --- Product Modal Component ---
const ProductModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [added, setAdded] = useState(false);

  if (!isOpen || !product) return null;

  const images = product.imagens && product.imagens.length > 0 ? product.imagens : [];
  const hasMultipleImages = images.length > 1;

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
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 800);
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
    padding: '16px'
  };

  const modalStyle = {
    background: 'white',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '512px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column'
  };

  const imageContainerStyle = {
    position: 'relative',
    background: 'linear-gradient(to bottom right, #f1f5f9, #f8fafc)',
    aspectRatio: '1/1',
    maxHeight: '300px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 10,
    width: '40px',
    height: '40px',
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
    width: '40px',
    height: '40px',
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

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: '0px',
    maxHeight: '300px'
  };

  const dotsContainerStyle = {
    position: 'absolute',
    bottom: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px'
  };

  const infoContainerStyle = {
    padding: '24px',
    overflow: 'auto',
    flex: 1
  };

  const headerInfoStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '16px'
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    flex: 1
  };

  const priceStyle = {
    fontSize: '22px',
    fontWeight: 'bold',
    color: 'rgb(15, 190, 64)',
    whiteSpace: 'nowrap'
  };

  const tagsContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '24px'
  };

  const descriptionStyle = {
    color: '#64748b',
    fontSize: '14px',
    marginBottom: '24px',
    lineHeight: '1.6'
  };

  const getButtonStyle = () => {
    if (added) {
      return {
        width: '100%',
        padding: '16px',
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
        transition: 'all 0.3s ease'
      };
    }
    if (product.estoque === 0) {
      return {
        width: '100%',
        padding: '16px',
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
        opacity: 0.7
      };
    }
    return {
      width: '100%',
      padding: '16px',
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
      transition: 'all 0.3s ease'
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
          <button onClick={onClose} style={closeButtonStyle}>
            <X style={{ width: '20px', height: '20px', color: '#475569' }} />
          </button>

          {images.length > 0 ? (
            <img src={images[currentImageIndex]} alt={product.nome} style={imageStyle} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package style={{ width: '64px', height: '64px', color: '#cbd5e1' }} />
            </div>
          )}

          {hasMultipleImages && (
            <>
              <button onClick={prevImage} style={{ ...navButtonStyle, left: '12px' }}>
                <ChevronLeft style={{ width: '20px', height: '20px', color: '#475569' }} />
              </button>
              <button onClick={nextImage} style={{ ...navButtonStyle, right: '12px' }}>
                <ChevronRight style={{ width: '20px', height: '20px', color: '#475569' }} />
              </button>

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
            </>
          )}
        </div>

        <div style={infoContainerStyle}>
          <div style={headerInfoStyle}>
            <h2 style={titleStyle}>{product.nome}</h2>
            <span style={priceStyle}>R$ {product.preco?.toFixed(2)}</span>
          </div>

          <div style={tagsContainerStyle}>
            {product.tipo && (
              <span style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '600',
                background: product.tipo === 'adulto' || product.tipo === 'Adulto' ? '#f3e8ff' : '#fce7f3',
                color: product.tipo === 'adulto' || product.tipo === 'Adulto' ? '#7c3aed' : '#db2777'
              }}>
                {product.tipo === 'adulto' || product.tipo === 'Adulto' ? 'Adulto' : 'Infantil'}
              </span>
            )}
            {product.tamanho && (
              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Tam: {product.tamanho}
              </span>
            )}
            {product.estoque !== undefined && (
              <span style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '600',
                background: product.estoque > 0 ? '#dcfce7' : '#fee2e2',
                color: product.estoque > 0 ? '#15803d' : '#dc2626'
              }}>
                {product.estoque > 0 ? `${product.estoque} em estoque` : 'Esgotado'}
              </span>
            )}
          </div>

          {product.descricao && (
            <p style={descriptionStyle}>{product.descricao}</p>
          )}

          <button
            onClick={handleAddToCart}
            disabled={product.estoque === 0}
            style={getButtonStyle()}
          >
            {added ? (
              <>
                <Check style={{ width: '20px', height: '20px' }} />
                Adicionado!
              </>
            ) : (
              <>
                <ShoppingCart style={{ width: '20px', height: '20px' }} />
                {product.estoque === 0 ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Product Card Component (15% smaller) ---
const ProductCard = ({ product, onProductClick }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (product.estoque === 0) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: isHovered ? '0 17px 21px -4px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    border: isHovered ? '1px solid #e9d5ff' : '1px solid #f1f5f9',
    transition: 'all 0.5s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transform: 'scale(0.85)',
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
    fontSize: '14px',
    fontWeight: 'bold',
    padding: '8px 20px',
    borderRadius: '4px',
    letterSpacing: '2px',
    zIndex: 5,
    textTransform: 'uppercase',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  };

  const photoBadgeStyle = {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    color: 'white',
    fontSize: '10px',
    padding: '3px 7px',
    borderRadius: '9999px',
    zIndex: 2
  };

  const infoStyle = {
    padding: '17px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  };

  const tagsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
    marginBottom: '10px'
  };

  const titleStyle = {
    fontWeight: '600',
    fontFamily: "'Inter', sans-serif",
    color: '#1e293b',
    marginBottom: '7px',
    fontSize: '15px',
    minHeight: '8px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    flex: 1
  };

  const footerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: '4px',
    borderTop: '1px solid #f1f5f9'
  };

  const priceStyle = {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#0fbe40ff'
  };

  const getAddButtonStyle = () => {
    if (added) {
      return {
        width: '34px',
        height: '34px',
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
    if (product.estoque === 0) {
      return {
        width: '34px',
        height: '34px',
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
      width: '34px',
      height: '34px',
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={imageContainerStyle}>
        {product.imagens && product.imagens.length > 0 ? (
          <img src={product.imagens[0]} alt={product.nome} style={imageStyle} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package style={{ width: '54px', height: '54px', color: '#cbd5e1' }} />
          </div>
        )}
        
        {product.estoque === 0 && (
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
              padding: '2px 7px',
              borderRadius: '9999px',
              fontSize: '9px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: product.tipo === 'adulto' || product.tipo === 'Adulto' ? '#f3e8ff' : '#fce7f3',
              color: product.tipo === 'adulto' || product.tipo === 'Adulto' ? '#7c3aed' : '#db2777'
            }}>
              {product.tipo === 'adulto' || product.tipo === 'Adulto' ? 'Adulto' : 'Infantil'}
            </span>
          )}
          {product.tamanho && (
            <span style={{
              background: '#f1f5f9',
              color: '#64748b',
              padding: '2px 7px',
              borderRadius: '9999px',
              fontSize: '9px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {product.tamanho}
            </span>
          )}
        </div>

        <h3 style={titleStyle}>{product.nome}</h3>

        <div style={footerStyle}>
          <span style={priceStyle}>R$ {product.preco?.toFixed(2)}</span>
          <button
            onClick={handleAdd}
            disabled={product.estoque === 0}
            style={getAddButtonStyle()}
          >
            {added ? <Check style={{ width: '17px', height: '17px' }} /> : <Plus style={{ width: '17px', height: '17px' }} />}
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
    padding: '16px'
  };

  const modalStyle = {
    background: 'white',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '448px',
    maxHeight: '85vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    padding: '24px',
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
    width: '40px',
    height: '40px',
    background: '#f3e8ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0
  };

  const closeButtonStyle = {
    width: '40px',
    height: '40px',
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
    padding: '16px'
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
    width: '50px',
    height: '50px',
    background: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    flexShrink: 0
  };

  const footerStyle = {
    padding: '24px',
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
    padding: '16px',
    borderRadius: '16px',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
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
              <ShoppingCart style={{ width: '20px', height: '20px', color: '#9333ea' }} />
            </div>
            <h2 style={titleStyle}>Seu Carrinho</h2>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>
            <X style={{ width: '20px', height: '20px', color: '#94a3b8' }} />
          </button>
        </div>

        <div style={contentStyle}>
          {cart.length === 0 ? (
            <div style={emptyStyle}>
              <div style={emptyIconStyle}>
                <ShoppingCart style={{ width: '40px', height: '40px', color: '#cbd5e1' }} />
              </div>
              <p style={{ color: '#94a3b8', fontWeight: '500', margin: 0 }}>Seu carrinho está vazio</p>
            </div>
          ) : (
            <div style={itemsContainerStyle}>
              {cart.map((item) => (
                <div key={item._id} style={itemStyle}>
                  <div style={itemImageStyle}>
                    {item.imagens?.[0] ? (
                      <img src={item.imagens[0]} alt={item.nome} style={{ width: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package style={{ width: '20px', height: '20px', color: '#cbd5e1' }} />
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h4 style={{ 
                      fontWeight: '600', 
                      color: '#1e293b', 
                      fontSize: '13px', 
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
                    <p style={{ color: 'rgb(15, 190, 64)', fontWeight: 'bold', margin: 0, fontSize: '13px' }}>R$ {item.preco?.toFixed(2)}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantidade - 1)}
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
                      <Minus style={{ width: quantityIconSize, height: quantityIconSize, color: '#475569' }} />
                    </button>
                    <span style={{ width: '24px', textAlign: 'center', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>{item.quantidade}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantidade + 1)}
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
                      <Plus style={{ width: quantityIconSize, height: quantityIconSize, color: '#475569' }} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item._id)}
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
                    <Trash2 style={{ width: trashIconSize, height: trashIconSize, color: '#ef4444' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div style={footerStyle}>
            <div style={totalRowStyle}>
              <span style={{ color: '#475569', fontWeight: '500' }}>Total</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'rgb(15, 190, 64)' }}>R$ {total.toFixed(2)}</span>
            </div>
            <button onClick={onCheckout} style={checkoutButtonStyle}>
              <Send style={{ width: '20px', height: '20px' }} />
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

  const WHATSAPP_NUMBER = '5563984011186';

  const handleSubmit = (e) => {
    e.preventDefault();
    const produtos = cart
      .map((item) => `• ${item.nome} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2)}`)
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
    padding: '16px'
  };

  const modalStyle = {
    background: 'white',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '448px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
  };

  const headerStyle = {
    padding: '24px',
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

  // fontSize 16px prevents iOS zoom on input focus
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
    padding: '16px',
    borderRadius: '16px',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '24px'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#f3e8ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin style={{ width: '20px', height: '20px', color: '#9333ea' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Dados de Entrega</h2>
          </div>
          <button
            onClick={onClose}
            style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <X style={{ width: '20px', height: '20px', color: '#94a3b8' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
            <Send style={{ width: '20px', height: '20px' }} />
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

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
    display: 'flex',
    flexDirection: 'column'
  };

  const mainStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '32px 16px',
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
    padding: '48px 32px',
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
    fontSize: '18px',
    color: '#e2e8f0',
    marginBottom: '24px',
    letterSpacing: '0.5px'
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
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
            gap: 4px !important;
          }
        }
        @media (max-width: 480px) {
          .grid-container {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 2px !important;
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
            <Package style={{ width: '64px', height: '64px', color: '#cbd5e1', margin: '0 auto 16px' }} />
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
            <Moon style={{ width: '24px', height: '24px', color: '#c084fc' }} />
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Peluma Pijamas</span>
          </div>
          <p style={footerQuoteStyle}>
            "Sua paz em forma de pijama"
          </p>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
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
    listarProdutos()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
