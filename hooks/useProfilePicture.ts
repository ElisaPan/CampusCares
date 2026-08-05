import * as api from '@/api';
import { useUserStore } from '@/hooks/useUserStore';
import { Alert } from 'react-native';

export function useProfilePicture() {
  const { currentUser, setCurrentUser, students, setStudents, showPopup } = useUserStore();

  const updateProfilePicture = async (imageUri: string) => {
    if (!currentUser) return;

    try {
      // Pass UploadFile object, not FormData — uploadProfilePicture builds FormData internally
      const imageUrl = await api.uploadProfilePicture({
        uri: imageUri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });

      const updatedUser = {
        ...currentUser,
        profile_image: imageUrl,
        profilePictureUrl: imageUrl,
        _lastUpdate: Date.now(),
      };

      setCurrentUser(updatedUser);
      setStudents(students.map((s) => (s.id === currentUser.id ? updatedUser : s)));

      // updateUser takes id + data object
      await api.updateUser(currentUser.id, { profile_image: imageUrl });

      showPopup(
        'Profile Picture Updated!',
        'Your profile picture has been successfully updated!',
        'success'
      );
    } catch (error: any) {
      Alert.alert('Error', `Error updating profile picture: ${error.message}`);
      setCurrentUser(currentUser);
      setStudents(students.map((s) => (s.id === currentUser.id ? currentUser : s)));
    }
  };

  return { updateProfilePicture };
}