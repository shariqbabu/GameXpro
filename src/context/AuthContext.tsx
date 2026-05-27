import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';

import {
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';

import {
  auth,
  db,
} from '../firebase/config';

import type {
  User,
} from '../types';

interface AuthContextType {

  currentUser:
    FirebaseUser | null;

  userProfile:
    User | null;

  loading: boolean;

  isAdmin: boolean;

  logout: () => Promise<void>;

  refreshProfile:
    () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextType>({

    currentUser: null,

    userProfile: null,

    loading: true,

    isAdmin: false,

    logout: async () => {},

    refreshProfile:
      async () => {},
  });

export const useAuth = () =>
  useContext(AuthContext);

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {

  const [
    currentUser,
    setCurrentUser,
  ] = useState<FirebaseUser | null>(
    null
  );

  const [
    userProfile,
    setUserProfile,
  ] = useState<User | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  // FETCH PROFILE
  const fetchUserProfile =
    async (
      uid: string
    ) => {

      try {

        const userRef =
          doc(
            db,
            'users',
            uid
          );

        const walletRef =
          doc(
            db,
            'wallets',
            uid
          );

        const [
          userSnap,
          walletSnap,
        ] = await Promise.all([
          getDoc(userRef),
          getDoc(walletRef),
        ]);

        if (
          !userSnap.exists()
        ) {

          setUserProfile(
            null
          );

          return;
        }

        const userData =
          userSnap.data();

        const walletData =
          walletSnap.exists()
            ? walletSnap.data()
            : {};

        setUserProfile({

          uid,

          ...userData,

          walletBalance:
            Number(
              walletData?.totalBalance ?? 0
            ),

          winningBalance:
            Number(
              walletData?.winningBalance ?? 0
            ),

          depositBalance:
            Number(
              walletData?.depositBalance ?? 0
            ),

          bonusBalance:
            Number(
              walletData?.bonusBalance ?? 0
            ),

          lockedBalance:
            Number(
              walletData?.lockedBalance ?? 0
            ),

          referralEarnings:
            Number(
              walletData?.referralEarnings ?? 0
            ),

        } as User);

      } catch (error) {

        console.error(
          'Fetch profile error:',
          error
        );

        setUserProfile(
          null
        );
      }
    };

  // REFRESH PROFILE
  const refreshProfile =
    async () => {

      if (
        !currentUser?.uid
      )
        return;

      await fetchUserProfile(
        currentUser.uid
      );
    };

  // LOGOUT
  const logout =
    async () => {

      try {

        await signOut(auth);

      } catch (error) {

        console.error(
          'Logout error:',
          error
        );

      } finally {

        setUserProfile(
          null
        );

        setCurrentUser(
          null
        );
      }
    };

  // AUTH LISTENER
  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {

          try {

            setLoading(
              true
            );

            setCurrentUser(
              user
            );

            if (
              user?.uid
            ) {

              await fetchUserProfile(
                user.uid
              );

            } else {

              setUserProfile(
                null
              );
            }

          } catch (
            error
          ) {

            console.error(
              'Auth state error:',
              error
            );

            setUserProfile(
              null
            );

          } finally {

            setLoading(
              false
            );
          }
        }
      );

    return () =>
      unsubscribe();

  }, []);

  // REALTIME WALLET SYNC
  useEffect(() => {

    if (
      !currentUser?.uid
    )
      return;

    const unsubscribe =
      onSnapshot(
        doc(
          db,
          'wallets',
          currentUser.uid
        ),
        (snap) => {

          if (
            !snap.exists()
          )
            return;

          const wallet =
            snap.data();

          setUserProfile(
            (prev) => {

              if (!prev)
                return prev;

              return {

                ...prev,

                walletBalance:
                  Number(
                    wallet.totalBalance || 0
                  ),

                winningBalance:
                  Number(
                    wallet.winningBalance || 0
                  ),

                depositBalance:
                  Number(
                    wallet.depositBalance || 0
                  ),

                bonusBalance:
                  Number(
                    wallet.bonusBalance || 0
                  ),

                lockedBalance:
                  Number(
                    wallet.lockedBalance || 0
                  ),

                referralEarnings:
                  Number(
                    wallet.referralEarnings || 0
                  ),
              };
            }
          );
        }
      );

    return () =>
      unsubscribe();

  }, [currentUser]);

  const isAdmin =
    userProfile?.role ===
    'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
