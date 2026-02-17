'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useSwitchChain, useDisconnect } from 'wagmi';
import { useSendCalls, useCallsStatus } from 'wagmi/experimental';
import { parseEther, encodeFunctionData } from 'viem';
import { Attribution } from 'ox/erc8021';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Name } from '@coinbase/onchainkit/identity';
import { base } from 'wagmi/chains';
import DinoGame from './components/DinoGame';
import type { DinoGameHandle } from './components/DinoGame';
import { DINO_CONTRACT_ADDRESS, DINO_CONTRACT_ABI } from './contracts/DinoGame';

const BUILDER_CODE_SUFFIX = Attribution.toDataSuffix({ codes: ['bc_w4d5vvy9'] });

function PlayerName({ address }: { address: string }) {
  const [fcName, setFcName] = useState<string | null>(null);
  const [triedFc, setTriedFc] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/resolve-names?address=${address}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          if (data.name) setFcName(data.name);
          setTriedFc(true);
        }
      })
      .catch(() => { if (!cancelled) setTriedFc(true); });

    return () => { cancelled = true; };
  }, [address]);

  if (fcName) return <span>{fcName}</span>;
  if (!triedFc) return <span>{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>;

  return <Name address={address as `0x${string}`} chain={base} />;
}

export default function Home() {
  const { setMiniAppReady } = useMiniKit();

  useEffect(() => {
    setMiniAppReady();
  }, [setMiniAppReady]);

  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const isWrongNetwork = isConnected && chainId !== undefined && chainId !== 8453;

  const [isPlaying, setIsPlaying] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [hasPaid, setHasPaid] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const gameRef = useRef<DinoGameHandle>(null);

  const { sendCalls: payToPlay, data: payCallsId, isPending: isPaying } = useSendCalls();
  const { writeContract: submitScore } = useWriteContract();

  const payBundleId = payCallsId?.id;
  const { data: payCallsStatus } = useCallsStatus({
    id: payBundleId as string,
    query: {
      enabled: !!payBundleId,
      refetchInterval: (query) =>
        query.state.data?.status === 'success' ? false : 1000,
    },
  });
  const payConfirmed = payCallsStatus?.status === 'success';

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
      calls: [{
        to: DINO_CONTRACT_ADDRESS,
        data: encodeFunctionData({
          abi: DINO_CONTRACT_ABI,
          functionName: 'payToPlay',
        }),
        value: parseEther('0.000004'),
      }],
      capabilities: {
        dataSuffix: {
          value: BUILDER_CODE_SUFFIX,
          optional: true,
        },
      },
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

    const lowestTop3 = personalBest ? Number(personalBest[2]) : 0;
    if (isConnected && score > 0 && score > lowestTop3) {
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

  const handleJump = useCallback(() => {
    if (isPlaying) {
      gameRef.current?.jump();
    }
  }, [isPlaying]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const uniqueLeaderboard = useMemo(() => {
    if (!globalTop10) return [];
    const bestByPlayer = new Map<string, { player: string; score: bigint }>();
    for (const entry of globalTop10) {
      const score = BigInt(entry.score);
      if (score <= BigInt(0)) continue;
      const addr = entry.player.toLowerCase();
      const existing = bestByPlayer.get(addr);
      if (!existing || score > existing.score) {
        bestByPlayer.set(addr, { player: entry.player, score });
      }
    }
    return Array.from(bestByPlayer.values())
      .sort((a, b) => (b.score > a.score ? 1 : b.score < a.score ? -1 : 0));
  }, [globalTop10]);

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

      {/* Burger menu (when connected) or ConnectWallet (when not) */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 50 }}>
        {isConnected ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 82, 255, 0.15)',
                borderRadius: '12px',
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                boxShadow: '0 4px 12px rgba(0, 82, 255, 0.1)',
              }}
            >
              <div style={{ width: '20px', height: '2px', background: '#0052FF', borderRadius: '1px', transition: 'all 0.2s' }} />
              <div style={{ width: '20px', height: '2px', background: '#0052FF', borderRadius: '1px', transition: 'all 0.2s' }} />
              <div style={{ width: '20px', height: '2px', background: '#0052FF', borderRadius: '1px', transition: 'all 0.2s' }} />
            </button>

            {menuOpen && (
              <>
                <div
                  onClick={() => setMenuOpen(false)}
                  style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: -1,
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '52px',
                  right: 0,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 8px 30px rgba(0, 82, 255, 0.2)',
                  border: '1px solid rgba(0, 82, 255, 0.1)',
                  minWidth: '220px',
                }}>
                  <div style={{
                    color: '#0052FF',
                    fontSize: '12px',
                    fontWeight: '600',
                    opacity: 0.5,
                    marginBottom: '4px',
                    letterSpacing: '1px',
                  }}>
                    WALLET
                  </div>
                  <div style={{
                    color: '#0052FF',
                    fontSize: '14px',
                    fontWeight: '700',
                    marginBottom: '16px',
                    padding: '8px 12px',
                    background: 'rgba(0, 82, 255, 0.06)',
                    borderRadius: '10px',
                    wordBreak: 'break-all',
                  }}>
                    {address && formatAddress(address)}
                  </div>
                  <button
                    onClick={() => { disconnect(); setMenuOpen(false); }}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 68, 68, 0.08)',
                      color: '#FF4444',
                      border: '1px solid rgba(255, 68, 68, 0.2)',
                      borderRadius: '12px',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <ConnectWallet />
        )}
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
          Wrong network! Please switch to Base
        </div>
      )}

      {/* PLAYING badge - outside game container to avoid overlap */}
      {isPlaying && (
        <div style={{
          background: 'linear-gradient(135deg, #0052FF, #0066FF)',
          color: 'white',
          padding: '6px 20px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '700',
          boxShadow: '0 4px 12px rgba(0, 82, 255, 0.35)',
          marginBottom: '10px',
        }}>
          🎮 PLAYING
        </div>
      )}

      <div style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '28px',
        padding: '16px',
        boxShadow: '0 12px 40px rgba(0, 82, 255, 0.18)',
        border: '1px solid rgba(0, 82, 255, 0.08)',
        position: 'relative',
      }}>
        <DinoGame ref={gameRef} onGameOver={handleGameOver} isPlaying={isPlaying} />
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

      {/* Full-screen tap overlay during gameplay */}
      {isPlaying && (
        <div
          onClick={handleJump}
          onTouchStart={(e) => { e.preventDefault(); handleJump(); }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5,
            touchAction: 'none',
          }}
        />
      )}

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
          {uniqueLeaderboard.map((entry, i) => (
              <div key={entry.player} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: i === 0 ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.1))' : 'rgba(0, 82, 255, 0.04)',
                borderRadius: '10px',
                marginBottom: '6px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span style={{ color: '#0052FF', fontSize: '13px', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <PlayerName address={entry.player} />
                  </span>
                </div>
                <span style={{ color: '#0052FF', fontWeight: '800', fontSize: '16px', flexShrink: 0, marginLeft: '8px' }}>
                  {Number(entry.score)}
                </span>
              </div>
          ))}
          {uniqueLeaderboard.length === 0 && (
            <p style={{ color: '#0052FF', opacity: 0.5, textAlign: 'center', fontSize: '14px' }}>
              No scores yet. Be the first! 🚀
            </p>
          )}
        </div>
      )}

      <div style={{
        marginTop: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            Built on Base by Hopscup
          </p>
        </div>
        <a
          href="https://x.com/hopscup"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#0052FF',
            fontSize: '13px',
            fontWeight: '600',
            opacity: 0.5,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          @hopscup
        </a>
      </div>
    </div>
  );
}
