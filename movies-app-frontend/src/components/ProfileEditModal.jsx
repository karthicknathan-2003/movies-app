import { useState } from 'react';

import { FaSpinner } from 'react-icons/fa';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';

function buildProfileForm(profile) {
  return {
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    avatarUrl: profile?.avatarUrl || '',
    interests: profile?.interests || '',
  };
}

function ProfileEditForm({ profile, onSave, saving }) {
  const [form, setForm] = useState(() => buildProfileForm(profile));

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => onSave(form);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>First Name</Label>
          <Input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label>Last Name</Label>
          <Input
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <Label>Avatar URL</Label>
        <Input
          name="avatarUrl"
          value={form.avatarUrl}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label>Location</Label>
        <Input
          name="location"
          value={form.location}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label>Interests</Label>
        <Input
          name="interests"
          placeholder="Action, Sci-Fi, Anime"
          value={form.interests}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label>Bio</Label>
        <Textarea
          rows={5}
          name="bio"
          value={form.bio}
          onChange={handleChange}
        />
      </div>

      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={saving}
      >
        {saving ? (
          <>
            <FaSpinner className="mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </div>
  );
}

export default function ProfileEditModal({
  open,
  onOpenChange,
  profile,
  onSave,
  saving,
}) {
  const formKey = `${profile?.id ?? profile?.username ?? 'profile-form'}-${open ? 'open' : 'closed'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <ProfileEditForm
          key={formKey}
          profile={profile}
          onSave={onSave}
          saving={saving}
        />
      </DialogContent>
    </Dialog>
  );
}
