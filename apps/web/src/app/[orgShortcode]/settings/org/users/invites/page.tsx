'use client';

import { DataTable } from '@/src/components/shared/table';
import { platform } from '@/src/lib/trpc';
import { useGlobalStore } from '@/src/providers/global-store-provider';
import { columns } from './_components/columns';
import { InviteModal } from './_components/invite-modal';

export default function Page() {
  const orgShortcode = useGlobalStore((state) => state.currentOrg.shortcode);
  const { data: inviteList, isLoading } =
    platform.org.users.invites.viewInvites.useQuery({
      orgShortcode
    });

  return (
    <div className="flex w-full flex-col gap-2 p-4">
      <div className="flex w-full justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl leading-5">Invites</h1>
          <div>Manage Your Org Invitation</div>
        </div>
        <InviteModal />
      </div>
      {isLoading && <div>Loading...</div>}
      {inviteList && (
        <DataTable
          columns={columns}
          data={inviteList.invites ?? []}
        />
      )}
    </div>
  );
}
