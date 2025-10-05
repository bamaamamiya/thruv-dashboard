const getCreatedAtDate = (lead) => {
  if (!lead.createdAt) return null;
  if (lead.createdAt.toDate) return lead.createdAt.toDate(); // Firestore Timestamp
  if (lead.createdAt.seconds) return new Date(lead.createdAt.seconds * 1000); // object
  if (typeof lead.createdAt === "string" || typeof lead.createdAt === "number")
    return new Date(lead.createdAt);
  return null;
};
