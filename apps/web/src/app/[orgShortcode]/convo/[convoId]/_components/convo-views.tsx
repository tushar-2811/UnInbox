import { platform } from '@/src/lib/trpc';
import Link from 'next/link';
import { type TypeId } from '@u22n/utils/typeid';
import { useGlobalStore } from '@/src/providers/global-store-provider';
import { useMemo } from 'react';
import { formatParticipantData } from '../../utils';
import { MessagesPanel } from './messages-panel';
import TopBar from './top-bar';
import { ReplyBox } from './reply-box';
import { Button } from '@/src/components/shadcn-ui/button';
import { env } from '@/src/env';
import { usePageTitle } from '@/src/hooks/use-page-title';

export function ConvoView({ convoId }: { convoId: TypeId<'convos'> }) {
  const orgShortcode = useGlobalStore((state) => state.currentOrg.shortcode);
  const {
    data: convoData,
    isLoading: convoDataLoading,
    error: convoError
  } = platform.convos.getConvo.useQuery({
    orgShortcode,
    convoPublicId: convoId
  });

  usePageTitle(convoData?.data.subjects[0]?.subject ?? 'UnInbox');

  const attachments = useMemo(() => {
    if (!convoData) return [];
    return convoData.data.attachments
      .filter((f) => !f.inline)
      .map((attachment) => ({
        name: attachment.fileName,
        url: `${env.NEXT_PUBLIC_STORAGE_URL}/attachment/${orgShortcode}/${attachment.publicId}/${attachment.fileName}`,
        type: attachment.type,
        publicId: attachment.publicId
      }));
  }, [convoData, orgShortcode]);

  const participantOwnPublicId = convoData?.ownParticipantPublicId;
  const convoHidden = useMemo(
    () =>
      convoData
        ? convoData?.data.participants.find(
            (p) => p.publicId === participantOwnPublicId
          )?.hidden ?? false
        : null,
    [convoData, participantOwnPublicId]
  );

  const formattedParticipants = useMemo(() => {
    const formattedParticipantsData: NonNullable<
      ReturnType<typeof formatParticipantData>
    >[] = [];
    if (convoData?.data.participants) {
      for (const participant of convoData.data.participants) {
        const formattedParticipant = formatParticipantData(participant);
        if (!formattedParticipant) continue;
        formattedParticipantsData.push(formattedParticipant);
      }
    }
    return formattedParticipantsData;
  }, [convoData?.data.participants]);

  if (convoError && convoError.data?.code === 'NOT_FOUND') {
    return <ConvoNotFound />;
  }

  return (
    <div className="flex h-full max-h-full w-full max-w-full flex-col overflow-hidden rounded-2xl">
      <TopBar
        isConvoLoading={convoDataLoading}
        convoId={convoId}
        convoHidden={convoHidden}
        subjects={convoData?.data.subjects}
        participants={formattedParticipants}
        attachments={attachments}
      />
      <div className="flex h-full w-full min-w-96 flex-col">
        {convoDataLoading || !participantOwnPublicId ? (
          <span>Loading</span>
        ) : (
          <MessagesPanel
            convoId={convoId}
            formattedParticipants={formattedParticipants}
            participantOwnPublicId={
              participantOwnPublicId as TypeId<'convoParticipants'>
            }
          />
        )}
      </div>
      <ReplyBox convoId={convoId} />
    </div>
  );
}

export function ConvoNotFound() {
  const orgShortcode = useGlobalStore((state) => state.currentOrg.shortcode);
  usePageTitle('Convo Not Found');

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div>
        <span>Convo Not Found</span>
        <span>
          The convo you are looking for does not exist. Please check the URL and
          try again.
        </span>
        <Link href={`/${orgShortcode}/convo`}>
          <Button>Go back to Convos</Button>
        </Link>
      </div>
    </div>
  );
}
