// src/pages/games/LudoGame.tsx

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  GlowButton,
} from '../../components/ui/GlowButton';

import toast from 'react-hot-toast';

import {
  ChevronLeft,
  Clock,
  Trophy,
  Shield,
  Users,
  Zap,
  RotateCcw,
  Wallet,
} from 'lucide-react';

import {
  doc,
  onSnapshot,
} from 'firebase/firestore';

import {
  db,
} from '../../firebase/config';

import {
  joinMatchmaking,
  cancelMatchmaking,
  listenForMatch,
  listenToGame,
  submitRoll,
  tickTimer,
  forfeitGame,
  settlePrize,
  type LudoGameDoc,
} from '../../services/ludoService';

const DICE_FACES = [
  '⚀',
  '⚁',
  '⚂',
  '⚃',
  '⚄',
  '⚅',
];

const ENTRY_FEES = [
  50,
  100,
  200,
  500,
  1000,
  2000,
];

type UIPhase =
  | 'lobby'
  | 'matchmaking'
  | 'in_game'
  | 'game_over';

export const LudoGame = () => {

  const navigate =
    useNavigate();

  const {
    userProfile,
    currentUser,
    refreshProfile,
  } = useAuth();

  const uid =
    currentUser?.uid ?? '';

  const uname =
    userProfile?.username ??
    'Player';

  const [walletData, setWalletData] =
    useState<any>(null);

  const [uiPhase, setUiPhase] =
    useState<UIPhase>('lobby');

  const [entryFee, setEntryFee] =
    useState(50);

  const [gameDoc, setGameDoc] =
    useState<LudoGameDoc | null>(
      null
    );

  const [myRole, setMyRole] =
    useState<'player1' | 'player2'>(
      'player1'
    );

  const [diceDisp, setDiceDisp] =
    useState('⚄');

  const [rolling, setRolling] =
    useState(false);

  const [mmSeconds, setMmSeconds] =
    useState(0);

  const [log, setLog] = useState<
    {
      msg: string;
      type:
        | 'p1'
        | 'p2'
        | 'sys';
    }[]
  >([
    {
      msg: 'Game starting...',
      type: 'sys',
    },
  ]);

  const timerRef =
    useRef<any>(null);

  const mmTimerRef =
    useRef<any>(null);

  const cancelTimerRef =
    useRef<any>(null);

  const settledRef =
    useRef(false);

  // REALTIME WALLET
  useEffect(() => {

    if (!uid) return;

    const unsubscribe =
      onSnapshot(
        doc(
          db,
          'wallets',
          uid
        ),
        (snap) => {

          if (snap.exists()) {

            setWalletData(
              snap.data()
            );
          }
        }
      );

    return () => unsubscribe();

  }, [uid]);

  // REAL BALANCE
  const balance =
    Number(
      walletData?.totalBalance ||
      walletData?.walletBalance ||
      userProfile?.walletBalance ||
      0
    );

  const prize =
    Math.floor(
      entryFee * 2 * 0.95
    );

  const addLog = (
    msg: string,
    type:
      | 'p1'
      | 'p2'
      | 'sys' = 'sys'
  ) => {

    setLog((prev) => [
      ...prev.slice(-25),
      {
        msg,
        type,
      },
    ]);
  };

  // GAME FINISH
  const handleGameFinish =
    useCallback(
      async (
        g: LudoGameDoc
      ) => {

        if (
          settledRef.current
        )
          return;

        settledRef.current =
          true;

        if (
          timerRef.current
        ) {
          clearInterval(
            timerRef.current
          );
        }

        try {

          await settlePrize(g);

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                1500
              )
          );

          await refreshProfile();

          const isWinner =
            g.winnerId === uid;

          const isDraw =
            g.winnerId === null;

          if (isDraw) {

            toast.success(
              'Match Draw!'
            );

          } else if (
            isWinner
          ) {

            toast.success(
              `🏆 ₹${g.prizePool} added to wallet!`
            );

          } else {

            toast.error(
              'You lost the match'
            );
          }

          setUiPhase(
            'game_over'
          );

        } catch (e: any) {

          console.error(
            e
          );

          toast.error(
            e?.message ||
              'Prize settlement failed'
          );

          settledRef.current =
            false;
        }
      },
      [
        refreshProfile,
        uid,
      ]
    );

  // FIND MATCH
  const findMatch =
    useCallback(
      async () => {

        if (!uid) {

          return toast.error(
            'Please login first'
          );
        }

        console.log(
          'CURRENT BALANCE:',
          balance
        );

        if (
          balance <
          entryFee
        ) {

          return toast.error(
            `Insufficient balance! Need ₹${entryFee}`
          );
        }

        setUiPhase(
          'matchmaking'
        );

        setMmSeconds(0);

        mmTimerRef.current =
          setInterval(() => {

            setMmSeconds(
              (s) => s + 1
            );

          }, 1000);

        addLog(
          'Searching for opponent...',
          'sys'
        );

        try {

          const {
            gameId,
            role,
          } =
            await joinMatchmaking(
              uid,
              uname,
              entryFee
            );

          setMyRole(role);

          settledRef.current =
            false;

          if (
            role ===
            'player2'
          ) {

            if (
              mmTimerRef.current
            ) {

              clearInterval(
                mmTimerRef.current
              );
            }

            toast.success(
              'Opponent found!'
            );

            listenToGame(
              gameId,
              (
                g
              ) => {

                setGameDoc(
                  g
                );

                if (
                  g.status ===
                    'finished' &&
                  !settledRef.current
                ) {

                  handleGameFinish(
                    g
                  );
                }
              }
            );

            setUiPhase(
              'in_game'
            );

          } else {

            listenForMatch(
              uid,
              (
                gid,
                foundRole
              ) => {

                if (
                  mmTimerRef.current
                ) {

                  clearInterval(
                    mmTimerRef.current
                  );
                }

                setMyRole(
                  foundRole
                );

                toast.success(
                  'Opponent joined!'
                );

                listenToGame(
                  gid,
                  (
                    g
                  ) => {

                    setGameDoc(
                      g
                    );

                    if (
                      g.status ===
                        'finished' &&
                      !settledRef.current
                    ) {

                      handleGameFinish(
                        g
                      );
                    }
                  }
                );

                setUiPhase(
                  'in_game'
                );
              }
            );

            cancelTimerRef.current =
              setTimeout(
                async () => {

                  await cancelMatchmaking(
                    uid,
                    entryFee
                  );

                  toast.error(
                    'No opponent found'
                  );

                  setUiPhase(
                    'lobby'
                  );

                },
                60000
              );
          }

        } catch (
          err: any
        ) {

          console.error(
            err
          );

          toast.error(
            err?.message ||
              'Failed to find match'
          );

          setUiPhase(
            'lobby'
          );
        }
      },
      [
        uid,
        uname,
        entryFee,
        balance,
        handleGameFinish,
      ]
    );

  // ROLL DICE
  const rollDice =
    async () => {

      if (
        !gameDoc ||
        rolling
      )
        return;

      if (
        gameDoc.currentTurn !==
        uid
      ) {

        return toast.error(
          "It's not your turn!"
        );
      }

      setRolling(true);

      let count = 0;

      const iv =
        setInterval(
          async () => {

            setDiceDisp(
              DICE_FACES[
                Math.floor(
                  Math.random() *
                    6
                )
              ]
            );

            count++;

            if (
              count >= 10
            ) {

              clearInterval(
                iv
              );

              const val =
                (Math.floor(
                  Math.random() *
                    6
                ) +
                  1) as
                  | 1
                  | 2
                  | 3
                  | 4
                  | 5
                  | 6;

              setDiceDisp(
                DICE_FACES[
                  val - 1
                ]
              );

              try {

                await submitRoll(
                  gameDoc.gameId,
                  uid,
                  val
                );

                addLog(
                  `You rolled ${val}`,
                  'p1'
                );

              } catch (
                e: any
              ) {

                toast.error(
                  e?.message ||
                    'Roll failed'
                );

              } finally {

                setRolling(
                  false
                );
              }
            }
          },
          80
        );
    };

  // FORFEIT
  const doForfeit =
    async () => {

      if (!gameDoc)
        return;

      try {

        await forfeitGame(
          gameDoc.gameId,
          uid
        );

        toast.error(
          'You forfeited'
        );

      } catch {}
    };

  // TIMER
  useEffect(() => {

    if (
      !gameDoc
    )
      return;

    timerRef.current =
      setInterval(
        async () => {

          try {

            if (
              myRole ===
              'player1'
            ) {

              await tickTimer(
                gameDoc.gameId
              );
            }

          } catch {}
        },
        1000
      );

    return () => {

      if (
        timerRef.current
      ) {

        clearInterval(
          timerRef.current
        );
      }
    };

  }, [
    gameDoc,
    myRole,
  ]);

  // MATCHMAKING SCREEN
  if (
    uiPhase ===
    'matchmaking'
  ) {

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-4">

        <motion.div
          animate={{
            scale: [
              1,
              1.08,
              1,
            ],
          }}
          transition={{
            repeat:
              Infinity,
            duration: 1.5,
          }}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center text-6xl"
        >
          🎲
        </motion.div>

        <div className="text-center">

          <h2 className="text-2xl font-bold text-white">
            Finding Opponent...
          </h2>

          <p className="text-white/40 mt-2">
            Waiting {mmSeconds}s
          </p>
        </div>

        <GlowButton
          variant="ghost"
          onClick={async () => {

            await cancelMatchmaking(
              uid,
              entryFee
            );

            setUiPhase(
              'lobby'
            );
          }}
        >
          <RotateCcw className="w-4 h-4" />

          Cancel Search
        </GlowButton>
      </div>
    );
  }

  // GAME OVER
  if (
    uiPhase ===
      'game_over' &&
    gameDoc
  ) {

    const isWinner =
      gameDoc.winnerId ===
      uid;

    return (
      <div className="max-w-md mx-auto py-10 px-4 text-center space-y-6">

        <div className="text-7xl">
          {isWinner
            ? '🏆'
            : '😔'}
        </div>

        <div>

          <h2 className="text-3xl font-bold text-white">
            {isWinner
              ? 'You Won!'
              : 'You Lost!'}
          </h2>

          <p className="text-white/40 mt-2">
            {isWinner
              ? `₹${gameDoc.prizePool} added to wallet`
              : 'Better luck next time'}
          </p>
        </div>

        <GlowButton
          onClick={() => {

            setGameDoc(
              null
            );

            setUiPhase(
              'lobby'
            );
          }}
        >
          Back To Lobby
        </GlowButton>
      </div>
    );
  }

  // GAME SCREEN
  if (
    uiPhase ===
      'in_game' &&
    gameDoc
  ) {

    const myTurn =
      gameDoc.currentTurn ===
      uid;

    return (
      <div className="space-y-4 pb-6 max-w-4xl mx-auto">

        {/* TOP */}
        <div className="flex items-center gap-3">

          <button
            onClick={() =>
              navigate(
                '/games'
              )
            }
            className="p-2 rounded-xl text-white/60 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div>

            <h1 className="text-lg font-bold text-white">
              🎲 Ludo Battle
            </h1>

            <p className="text-xs text-white/40">
              Prize:{' '}
              <span className="text-green-400 font-bold">
                ₹
                {
                  gameDoc.prizePool
                }
              </span>
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold">

            <Clock className="w-4 h-4" />

            {
              gameDoc.timeLeft
            }
            s
          </div>
        </div>

        {/* SCORE */}
        <div className="grid grid-cols-2 gap-3">

          <div className="glass rounded-2xl p-4 border border-red-500/20">

            <p className="text-red-400 text-xs font-bold">
              YOU
            </p>

            <h2 className="text-4xl font-black text-white mt-2">
              {
                gameDoc
                  .player1
                  .score
              }
            </h2>
          </div>

          <div className="glass rounded-2xl p-4 border border-blue-500/20">

            <p className="text-blue-400 text-xs font-bold">
              OPPONENT
            </p>

            <h2 className="text-4xl font-black text-white mt-2">
              {
                gameDoc
                  .player2
                  ?.score
              }
            </h2>
          </div>
        </div>

        {/* DICE */}
        <div className="glass rounded-3xl p-8 border border-white/10 text-center space-y-6">

          <motion.button
            onClick={
              rollDice
            }
            disabled={
              rolling ||
              !myTurn
            }
            whileTap={{
              scale: 0.9,
            }}
            animate={
              rolling
                ? {
                    rotate: 360,
                  }
                : {}
            }
            transition={{
              repeat:
                Infinity,
              duration: 0.4,
            }}
            className={`w-32 h-32 mx-auto rounded-3xl text-7xl flex items-center justify-center ${
              myTurn
                ? 'bg-purple-500/20 border-2 border-purple-500'
                : 'bg-white/5 border border-white/10 opacity-50'
            }`}
          >
            {
              diceDisp
            }
          </motion.button>

          <div>

            <p className="text-white/40 text-sm">
              {myTurn
                ? 'Your Turn'
                : 'Opponent Turn'}
            </p>

            <p className="text-white/20 text-xs mt-1">
              Roll dice to increase score
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3">

          <GlowButton
            variant="ghost"
            fullWidth
            onClick={
              doForfeit
            }
          >
            Forfeit Match
          </GlowButton>
        </div>

        {/* LOG */}
        <div className="glass rounded-2xl p-4 border border-white/10 space-y-2">

          <h3 className="text-sm font-bold text-white">
            Match Log
          </h3>

          <AnimatePresence>

            {log.map(
              (
                entry,
                i
              ) => (

                <motion.div
                  key={i}
                  initial={{
                    opacity: 0,
                    x: -10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  className="text-xs text-white/50"
                >
                  {
                    entry.msg
                  }
                </motion.div>
              )
            )}

          </AnimatePresence>
        </div>
      </div>
    );
  }

  // LOBBY
  return (
    <div className="space-y-5 pb-4 max-w-2xl mx-auto">

      {/* TOP */}
      <div className="flex items-center gap-3">

        <button
          onClick={() =>
            navigate(
              '/games'
            )
          }
          className="p-2 rounded-xl text-white/60 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div>

          <h1 className="text-xl font-bold text-white">
            🎲 Ludo Battle
          </h1>

          <p className="text-xs text-white/40">
            Real-time 1v1 betting
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 text-green-400 font-bold">

          <Wallet className="w-4 h-4" />

          ₹
          {balance.toFixed(
            0
          )}
        </div>
      </div>

      {/* HERO */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-blue-900/40 to-purple-900/30 border border-blue-500/20">

        <h2 className="text-2xl font-bold text-white">
          Win Real Cash
        </h2>

        <p className="text-white/50 mt-2 text-sm">
          Highest score after 5 minutes wins
        </p>

        <div className="flex items-center gap-4 mt-4 text-xs text-white/40">

          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />

            8.2K online
          </span>

          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-green-400" />

            Fair play
          </span>

          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />

            Instant payout
          </span>
        </div>
      </div>

      {/* ENTRY */}
      <div className="glass rounded-3xl p-5 border border-white/10 space-y-5">

        <h3 className="font-bold text-white">
          Select Entry Fee
        </h3>

        <div className="grid grid-cols-3 gap-3">

          {ENTRY_FEES.map(
            (fee) => (

              <button
                key={fee}
                onClick={() =>
                  setEntryFee(
                    fee
                  )
                }
                className={`py-4 rounded-2xl font-bold transition-all ${
                  entryFee ===
                  fee
                    ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-300'
                    : 'bg-white/5 border border-white/10 text-white'
                }`}
              >
                ₹{fee}
              </button>
            )
          )}
        </div>

        <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 space-y-2">

          <div className="flex justify-between text-sm">

            <span className="text-white/50">
              Entry Fee
            </span>

            <span className="text-white font-semibold">
              ₹{entryFee}
            </span>
          </div>

          <div className="flex justify-between text-sm">

            <span className="text-white/50">
              Winning Prize
            </span>

            <span className="text-green-400 font-bold">
              ₹{prize}
            </span>
          </div>
        </div>

        {balance <
          entryFee && (

          <p className="text-red-400 text-sm text-center">
            Insufficient balance
          </p>
        )}

        <GlowButton
          fullWidth
          size="lg"
          onClick={
            findMatch
          }
          disabled={
            balance <
            entryFee
          }
        >
          <Trophy className="w-4 h-4" />

          Play Match — ₹
          {entryFee}
        </GlowButton>
      </div>
    </div>
  );
};
