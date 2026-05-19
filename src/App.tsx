import { useState, useEffect } from 'react';
import type { Product, CartItem, User } from './lib/types';
import { products } from './lib/catalog';

type View = 'catalog' | 'cart' | 'success';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<View>('catalog');
  const [loading, setLoading ] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const init = () => {
      (window as any).SuperApp.getOpenUserInfo({
        success: (res: any) => {
          setUser(res);
          setLoading(false);
        },
        fail: () => setLoading(false),
      });
    };

    // Polling hasta que el SDK esté listo
    const interval = setInterval(() => {
      if ((window as any).SuperApp?.getOpenUserInfo) {
        clearInterval(interval);
        init();
      }
    }, 100);

    // Timeout de 8 segundos
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setLoading(false);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);


  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    (window as any).SuperApp?.showToast({
      content: `${product.name} agregado al carrito`,
      type: 'success',
      duration: 2000,
    });
  }

  /* function removeFromCart(productId: string) {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  } */

  function updateQuantity(productId: string, delta: number) {
    setCart(prev =>
      prev
        .map(i =>
          i.product.id === productId
            ? { ...i, quantity: i.quantity + delta }
            : i
        )
        .filter(i => i.quantity > 0)
    );
  }

  async function handleCheckout() {
    setPaying(true);
    (window as any).SuperApp.tradePay({
      amount: total,
      currency: 'COP',
      description: `Pedido de ${cart.length} producto(s) · Super Delivery`,
      orderId: `order_${Date.now()}`,
      success: async (res: any) => {
        (window as any).SuperApp.showToast({
          content: `Pago exitoso · ${res.transaction_id}`,
          type: 'success',
          duration: 3000,
        });
        setCart([]);
        setView('success');
        setPaying(false);
      },
      fail: (err: any) => {
        (window as any).SuperApp.showToast({
          content: err.errorMessage || 'Pago cancelado',
          type: 'fail',
        });
        setPaying(false);
      },
      complete: () => setPaying(false),
    });
  }

async function handleGetLocation() {
  try {
    const loc = await (window as any).SuperApp.location.get();
    if (loc.error) {
      await (window as any).SuperApp.ui.showToast(loc.error);
    } else {
      await (window as any).SuperApp.ui.showAlert(
        'Tu ubicación',
        `Lat: ${loc.lat.toFixed(4)}\nLng: ${loc.lng.toFixed(4)}\nPrecisión: ${loc.accuracy?.toFixed(0)}m`
      );
    }
  } catch (e) {
    await (window as any).SuperApp.ui.showToast('Error obteniendo ubicación');
  }
}

  const total = cart.reduce(
    (sum, i) => sum + i.product.price * i.quantity, 0
  );
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🍔</div>
          <p style={{ color: '#888', marginTop: 12 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '-apple-system, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: '#FF5722', padding: '16px',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              Hola, {user?.name.split(' ')[0]} 👋
            </div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>
              Super Delivery Claro
            </div>
          </div>
          {view === 'catalog' && (
            <button
              onClick={() => setView('cart')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none', borderRadius: 20,
                padding: '8px 16px', color: 'white',
                cursor: 'pointer', fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              🛒 {cartCount > 0 && (
                <span style={{
                  background: 'white', color: '#FF5722',
                  borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 11, fontWeight: 700,
                }}>
                  {cartCount}
                </span>
              )}
              Carrito
            </button>
          )}
          {view === 'cart' && (
            <button
              onClick={() => setView('catalog')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none', borderRadius: 20,
                padding: '8px 16px', color: 'white',
                cursor: 'pointer', fontSize: 14,
              }}
            >
              ← Volver
            </button>
          )}
        </div>
      </div>

      {/* Catálogo */}
      {view === 'catalog' && (
        <div style={{ padding: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1a1a2e' }}>
            Menú del día
          </h2>
          <button
            onClick={handleGetLocation}
            style={{
              width: '100%',
              padding: '12px',
              background: '#009688',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            📍 Ver mi ubicación
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {products.map(product => (
              <div key={product.id} style={{
                background: 'white', borderRadius: 16,
                overflow: 'hidden', display: 'flex',
                border: '1px solid #eee',
              }}>
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: 100, height: 100, objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ padding: '12px', flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{product.name}</div>
                  <div style={{ fontSize: 12, color: '#888', margin: '4px 0' }}>
                    {product.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#FF5722', fontSize: 15 }}>
                      ${product.price.toLocaleString('es-CO')}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        background: '#FF5722', color: 'white',
                        border: 'none', borderRadius: 20,
                        padding: '6px 14px', fontSize: 12,
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carrito */}
      {view === 'cart' && (
        <div style={{ padding: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Tu pedido</h2>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              <div style={{ fontSize: 48 }}>🛒</div>
              <p style={{ marginTop: 12 }}>Tu carrito está vacío</p>
              <button
                onClick={() => setView('catalog')}
                style={{
                  marginTop: 16, background: '#FF5722',
                  color: 'white', border: 'none',
                  borderRadius: 20, padding: '10px 24px',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                Ver menú
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cart.map(item => (
                  <div key={item.product.id} style={{
                    background: 'white', borderRadius: 14,
                    padding: 14, display: 'flex',
                    alignItems: 'center', gap: 12,
                    border: '1px solid #eee',
                  }}>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.product.name}</div>
                      <div style={{ color: '#FF5722', fontWeight: 700, fontSize: 14 }}>
                        ${(item.product.price * item.quantity).toLocaleString('es-CO')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          border: '1.5px solid #eee', background: 'white',
                          cursor: 'pointer', fontSize: 16, fontWeight: 700,
                        }}
                      >-</button>
                      <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: '#FF5722', border: 'none',
                          color: 'white', cursor: 'pointer',
                          fontSize: 16, fontWeight: 700,
                        }}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total y checkout */}
              <div style={{
                background: 'white', borderRadius: 16,
                padding: 16, marginTop: 16,
                border: '1px solid #eee',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#888', fontSize: 14 }}>Subtotal</span>
                  <span style={{ fontSize: 14 }}>${total.toLocaleString('es-CO')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ color: '#888', fontSize: 14 }}>Domicilio</span>
                  <span style={{ fontSize: 14, color: '#4CAF50' }}>Gratis</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontWeight: 700, fontSize: 16,
                  borderTop: '1px solid #eee', paddingTop: 12,
                }}>
                  <span>Total</span>
                  <span style={{ color: '#FF5722' }}>${total.toLocaleString('es-CO')}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={paying}
                  style={{
                    width: '100%', marginTop: 16,
                    background: paying ? '#ccc' : '#FF5722',
                    color: 'white', border: 'none',
                    borderRadius: 14, padding: '14px',
                    fontSize: 15, fontWeight: 700,
                    cursor: paying ? 'not-allowed' : 'pointer',
                  }}
                >
                  {paying ? 'Procesando...' : `Pagar $${total.toLocaleString('es-CO')}`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Éxito */}
      {view === 'success' && (
        <div style={{
          minHeight: '80vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: 32, textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: 72 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 16 }}>
              ¡Pedido confirmado!
            </h2>
            <p style={{ color: '#888', marginTop: 8 }}>
              Tiempo estimado de entrega: 30 min
            </p>
            <button
              onClick={() => setView('catalog')}
              style={{
                marginTop: 24, background: '#FF5722',
                color: 'white', border: 'none',
                borderRadius: 14, padding: '14px 32px',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Hacer otro pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}