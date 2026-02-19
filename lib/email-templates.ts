export function getVideoProcessedEmail(
  userName: string,
  videoTitle: string,
  videoLink: string,
) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Seu vídeo está pronto! 🚀</h1>
      <p>Olá ${userName},</p>
      <p>O processamento do vídeo "<strong>${videoTitle}</strong>" foi concluído com sucesso.</p>
      <p>Seus cortes virais já estão disponíveis no dashboard.</p>
      <div style="margin: 30px 0;">
        <a href="${videoLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          Ver Cortes
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">Obrigado por usar o CortexAI!</p>
    </div>
  `;
}

export function getWelcomeEmail(userName: string) {
  return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Bem-vindo ao CortexAI! 🎉</h1>
        <p>Olá ${userName},</p>
        <p>Estamos muito felizes em ter você conosco.</p>
        <p>Comece agora mesmo a criar cortes virais dos seus vídeos favoritos.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Acessar Dashboard
          </a>
        </div>
      </div>
    `;
}
