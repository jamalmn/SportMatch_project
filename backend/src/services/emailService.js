const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === 'production') {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[emailService] Ethereal account:', testAccount.user);
  }

  return transporter;
}

async function sendEmail(to, subject, html) {
  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: '"SportMatch" <noreply@sportmatch.app>',
    to,
    subject,
    html,
  });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('[emailService] Preview:', previewUrl);
  }
  return info;
}

// ─── Templates ────────────────────────────────────────────────────────────────

function sendWelcomeEmail(user) {
  const subject = '¡Bienvenido/a a SportMatch!';
  const html = `
    <h2>Hola, ${user.name} 👋</h2>
    <p>Tu cuenta en <strong>SportMatch</strong> ha sido creada correctamente.</p>
    <p>Ya puedes buscar eventos deportivos, inscribirte y conectar con otros jugadores.</p>
    <p>¡Nos vemos en la cancha!</p>
  `;
  return sendEmail(user.email, subject, html);
}

function sendInscriptionConfirmedEmail(user, event) {
  const subject = `Inscripción confirmada: ${event.title}`;
  const html = `
    <h2>Hola, ${user.name}</h2>
    <p>Tu inscripción al evento <strong>${event.title}</strong> ha sido <strong>confirmada</strong>.</p>
    <ul>
      <li><strong>Fecha:</strong> ${new Date(event.date).toLocaleString('es-ES')}</li>
      <li><strong>Lugar:</strong> ${event.location}</li>
      <li><strong>Deporte:</strong> ${event.sport}</li>
    </ul>
    <p>¡Que lo disfrutes!</p>
  `;
  return sendEmail(user.email, subject, html);
}

function sendInscriptionCancelledEmail(user, event) {
  const subject = `Inscripción cancelada: ${event.title}`;
  const html = `
    <h2>Hola, ${user.name}</h2>
    <p>Tu inscripción al evento <strong>${event.title}</strong> ha sido <strong>cancelada</strong>.</p>
    <ul>
      <li><strong>Fecha:</strong> ${new Date(event.date).toLocaleString('es-ES')}</li>
      <li><strong>Lugar:</strong> ${event.location}</li>
    </ul>
    <p>Si fue un error, puedes volver a inscribirte desde la aplicación.</p>
  `;
  return sendEmail(user.email, subject, html);
}

function sendWaitlistPromotedEmail(user, event) {
  const subject = `¡Tienes plaza! ${event.title}`;
  const html = `
    <h2>¡Buenas noticias, ${user.name}!</h2>
    <p>Se ha liberado una plaza en <strong>${event.title}</strong> y has pasado de la lista de espera a estar <strong>confirmado/a</strong>.</p>
    <ul>
      <li><strong>Fecha:</strong> ${new Date(event.date).toLocaleString('es-ES')}</li>
      <li><strong>Lugar:</strong> ${event.location}</li>
      <li><strong>Deporte:</strong> ${event.sport}</li>
    </ul>
    <p>¡No te lo pierdas!</p>
  `;
  return sendEmail(user.email, subject, html);
}

function sendEventCancelledEmail(user, event) {
  const subject = `Evento cancelado: ${event.title}`;
  const html = `
    <h2>Hola, ${user.name}</h2>
    <p>Lamentamos informarte de que el evento <strong>${event.title}</strong> al que estabas inscrito/a ha sido <strong>cancelado</strong>.</p>
    <ul>
      <li><strong>Fecha original:</strong> ${new Date(event.date).toLocaleString('es-ES')}</li>
      <li><strong>Lugar:</strong> ${event.location}</li>
    </ul>
    <p>Disculpa los inconvenientes. Puedes explorar otros eventos disponibles en SportMatch.</p>
  `;
  return sendEmail(user.email, subject, html);
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendInscriptionConfirmedEmail,
  sendInscriptionCancelledEmail,
  sendWaitlistPromotedEmail,
  sendEventCancelledEmail,
};
