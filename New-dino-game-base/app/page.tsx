'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain } from 'wagmi';
import { parseEther } from 'viem';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import DinoGame from './components/DinoGame';
import { DINO_CONTRACT_ADDRESS, DINO_CONTRACT_ABI } from './contracts/DinoGame';

export default function Home() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const isWrongNetwork = isConnected && chainId !== undefined && chainId !== 8453;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [hasPaid, setHasPaid] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const { writeContract: payToPlay, data: payHash, isPending: isPaying } = useWriteContract();
  const { writeContract: submitScore } = useWriteContract();
  
  const { isSuccess: payConfirmed } = useWaitForTransactionReceipt({ hash: payHash });

  const { data: personalBest, refetch: refetchPersonal } = useReadContract({
    address: DINO_CONTRACT_ADDRESS,
    abi: DINO_CONTRACT_ABI,
    functionName: 'getPersonalBest',
    args: address ? [address] : undefined,
  });

  const { data: globalTop10, refetch: refetchGlobal } = useReadContract({
    address: DINO_CONTRACT_ADDRESS,
    abi: DINO_CONTRACT_ABI,
    functionName: 'getGlobalTop10',
  });

  useEffect(() => {
    if (payConfirmed) {
      setHasPaid(true);
    }
  }, [payConfirmed]);

  const handlePay = () => {
    if (!isConnected) return;
    
    if (isWrongNetwork) {
      switchChain({ chainId: 8453 });
      return;
    }
    
    payToPlay({
      address: DINO_CONTRACT_ADDRESS,
      abi: DINO_CONTRACT_ABI,
      functionName: 'payToPlay',
      value: parseEther('0.000004'),
    });
  };

  const handleStartGame = () => {
    if (hasPaid) {
      setIsPlaying(true);
      setShowGameOver(false);
    }
  };

  const handleGameOver = (score: number) => {
    setLastScore(score);
    setIsPlaying(false);
    setHasPaid(false);
    setShowGameOver(true);
    
    const currentBest = personalBest ? Number(personalBest[0]) : 0;
    setIsNewHighScore(score > currentBest);
    
    if (isConnected && score > 0) {
      submitScore({
        address: DINO_CONTRACT_ADDRESS,
        abi: DINO_CONTRACT_ABI,
        functionName: 'submitScore',
        args: [BigInt(score)],
      });
      
      setTimeout(() => {
        refetchPersonal();
        refetchGlobal();
      }, 3000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFFFFF 0%, #E8F4FF 50%, #D0E8FF 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(0,82,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(0,82,255,0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <ConnectWallet />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '6px',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #0052FF 0%, #0066FF 100%)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          boxShadow: '0 8px 24px rgba(0, 82, 255, 0.35)',
          transform: 'rotate(-5deg)'
        }}>
          🦖
        </div>
        <div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            color: '#0052FF',
            margin: 0,
            letterSpacing: '-1px',
          }}>
            DINO RUN
          </h1>
          <p style={{
            color: '#0052FF',
            margin: 0,
            fontSize: '12px',
            opacity: 0.6,
            fontWeight: '600',
            letterSpacing: '2px'
          }}>
            ONCHAIN ARCADE
          </p>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
        color: 'white',
        padding: '6px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '700',
        marginBottom: '20px',
        boxShadow: '0 4px 12px rgba(255, 165, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span>💰</span> 1¢ per game (0.000004 ETH)
      </div>

      {isWrongNetwork && (
        <div style={{
          background: '#FF4444',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '16px',
        }}>
          ⚠️ Wrong network! Please switch to Base
        </div>
      )}

      <div style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '28px',
        padding: '16px',
        boxShadow: '0 12px 40px rgba(0, 82, 255, 0.18)',
        border: '1px solid rgba(0, 82, 255, 0.08)',
        position: 'relative'
      }}>
        {isPlaying && (
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #0052FF, #0066FF)',
            color: 'white',
            padding: '6px 20px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(0, 82, 255, 0.35)',
            zIndex: 10
          }}>
            🎮 PLAYING
          </div>
        )}
        
        <DinoGame onGameOver={handleGameOver} isPlaying={isPlaying} />
      </div>

      <p style={{
        color: '#0052FF',
        marginTop: '12px',
        fontSize: '13px',
        opacity: 0.5,
        fontWeight: '500'
      }}>
        SPACE / Tap to jump 🦘
      </p>

      {showGameOver && !isPlaying && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 40, 120, 0.25)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '32px',
            padding: '36px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 82, 255, 0.3)',
            maxWidth: '340px',
            width: '90%',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowGameOver(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0, 82, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#0052FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
            
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>
              {isNewHighScore ? '🏆' : '💀'}
            </div>
            
            <h2 style={{ 
              color: '#0052FF', 
              fontSize: '22px', 
              fontWeight: '800', 
              margin: '0 0 4px 0',
            }}>
              {isNewHighScore ? 'NEW HIGH SCORE!' : 'GAME OVER'}
            </h2>
            
            <p style={{ 
              color: '#0052FF', 
              fontSize: '56px', 
              fontWeight: '800', 
              margin: '8px 0 20px 0',
            }}>
              {lastScore}
            </p>
            
            {isNewHighScore && (
              <div style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '700',
                marginBottom: '20px',
              }}>
                🎉 Saved onchain! 🎉
              </div>
            )}
            
            {!hasPaid ? (
              <button
                onClick={handlePay}
                disabled={!isConnected || isPaying}
                style={{
                  width: '100%',
                  background: isConnected ? 'linear-gradient(135deg, #0052FF 0%, #0066FF 100%)' : '#ccc',
                  color: 'white',
                  fontWeight: '700',
                  padding: '18px 32px',
                  borderRadius: '18px',
                  fontSize: '17px',
                  border: 'none',
                  cursor: isConnected ? 'pointer' : 'not-allowed',
                  boxShadow: '0 6px 20px rgba(0, 82, 255, 0.4)',
                }}
              >
                {!isConnected ? '🔗 Connect Wallet' : isPaying ? '⏳ Confirming...' : isWrongNetwork ? '🔄 Switch to Base' : '💰 Play Again (1¢)'}
              </button>
            ) : (
              <button
                onClick={handleStartGame}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
                  color: 'white',
                  fontWeight: '700',
                  padding: '18px 32px',
                  borderRadius: '18px',
                  fontSize: '17px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(0, 200, 83, 0.4)',
                }}
              >
                🎮 Start Game!
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {!isPlaying && !showGameOver && (
          <>
            {!isConnected ? (
              <ConnectWallet />
            ) : !hasPaid ? (
              <button
                onClick={handlePay}
                disabled={isPaying}
                style={{
                  background: 'linear-gradient(135deg, #0052FF 0%, #0066FF 100%)',
                  color: 'white',
                  fontWeight: '700',
                  padding: '18px 56px',
                  borderRadius: '20px',
                  fontSize: '18px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(0, 82, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                {isPaying ? '⏳ Confirming...' : isWrongNetwork ? '🔄 Switch to Base' : '💰 Pay 1¢ to Play'}
              </button>
            ) : (
              <button
                onClick={handleStartGame}
                style={{
                  background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
                  color: 'white',
                  fontWeight: '700',
                  padding: '18px 56px',
                  borderRadius: '20px',
                  fontSize: '18px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(0, 200, 83, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                🎮 Start Game!
              </button>
            )}
          </>
        )}
      </div>

      {isConnected && personalBest && !isPlaying && (
        <div style={{
          marginTop: '24px',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          padding: '16px 24px',
          minWidth: '220px',
          boxShadow: '0 8px 24px rgba(0, 82, 255, 0.12)',
        }}>
          <h3 style={{
            color: '#0052FF',
            fontSize: '13px',
            fontWeight: '700',
            margin: '0 0 12px 0',
            textAlign: 'center',
            letterSpacing: '2px'
          }}>
            🎯 YOUR TOP 3
          </h3>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: i === 0 ? 'rgba(0, 82, 255, 0.1)' : 'transparent',
              borderRadius: '8px',
              marginBottom: '4px'
            }}>
              <span style={{ color: '#0052FF', fontWeight: '600' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </span>
              <span style={{ color: '#0052FF', fontWeight: '700', fontSize: '16px' }}>
                {personalBest[i] ? Number(personalBest[i]) : '-'}
              </span>
            </div>
          ))}
        </div>
      )}

      {globalTop10 && !isPlaying && (
        <div style={{
          marginTop: '20px',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          padding: '16px 24px',
          minWidth: '280px',
          boxShadow: '0 8px 24px rgba(0, 82, 255, 0.12)',
        }}>
          <h3 style={{
            color: '#0052FF',
            fontSize: '13px',
            fontWeight: '700',
            margin: '0 0 12px 0',
            textAlign: 'center',
            letterSpacing: '2px'
          }}>
            🌍 GLOBAL TOP 10
          </h3>
          {globalTop10.map((entry, i) => (
            Number(entry.score) > 0 && (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: i === 0 ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.1))' : 'rgba(0, 82, 255, 0.04)',
                borderRadius: '10px',
                marginBottom: '6px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span style={{ color: '#0052FF', fontSize: '13px', opacity: 0.7 }}>
                    {formatAddress(entry.player)}
                  </span>
                </div>
                <span style={{ color: '#0052FF', fontWeight: '800', fontSize: '16px' }}>
                  {Number(entry.score)}
                </span>
              </div>
            )
          ))}
          {!globalTop10.some(e => Number(e.score) > 0) && (
            <p style={{ color: '#0052FF', opacity: 0.5, textAlign: 'center', fontSize: '14px' }}>
              No scores yet. Be the first! 🚀
            </p>
          )}
        </div>
      )}

      <div style={{
        marginTop: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          background: '#0052FF',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            background: 'white',
            borderRadius: '50%'
          }} />
        </div>
        <p style={{
          color: '#0052FF',
          fontSize: '13px',
          fontWeight: '600',
          opacity: 0.6,
          margin: 0
        }}>
          Built on Base
        </p>
      </div>
    </div>
  );
}