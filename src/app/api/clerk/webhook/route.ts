import { prisma } from "@/lib/prisma";

export const POST: (req: Request) => Promise<Response> = async (
  req: Request
): Promise<Response> => {
  try {
    const { data } = await req.json();

    console.log("New user sign in data");

    // Extract user data
    const emailAddress: string = data.email_addresses[0].email_address;
    const firstName: string = data.first_name;
    const lastName: string = data.last_name;
    const imageUrl: string = data.image_url;
    const id: string = data.id;

    // Save the data to the postgres database
    await prisma.account.create({
      data: {
        id,
        emailAddress,
        firstName,
        lastName,
        imageUrl,
      },
    });

    return new Response(
      JSON.stringify({
        message: "New webhook received and user saved to the database",
      }),
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to process webhook",
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
      }
    );
  }
};
