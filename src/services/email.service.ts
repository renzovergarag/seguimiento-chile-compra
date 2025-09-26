import axios from "axios";
import { EmailConfig, OfertaDocument } from "../models/types";

/**
 * Servicio para el envío de emails con reportes de ofertas
 * Utiliza el microservicio de emails neurox.cl
 */
export class EmailService {
    private readonly emailServiceUrl: string;

    constructor(emailServiceUrl: string) {
        this.emailServiceUrl = emailServiceUrl;
    }

    /**
     * Genera el contenido HTML para el email con la lista de ofertas
     * @param ofertas - Array de ofertas
     * @param emprendimiento - Nombre del emprendimiento
     * @param fecha - Fecha del reporte
     * @returns string - Contenido HTML
     */
    private generateEmailHTML(ofertas: OfertaDocument[], emprendimiento: string, fecha: string): string {
        if (ofertas.length === 0) {
            return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reporte de Ofertas - ${emprendimiento}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
            .no-ofertas { text-align: center; padding: 40px; color: #7f8c8d; font-size: 18px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1; text-align: center; color: #7f8c8d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Reporte de Ofertas</h1>
              <h2>${emprendimiento}</h2>
              <p>Fecha: ${fecha}</p>
            </div>
            <div class="no-ofertas">
              <h3>No se encontraron nuevas ofertas para hoy</h3>
              <p>No hay ofertas que coincidan con los criterios configurados para este emprendimiento.</p>
            </div>
            <div class="footer">
              <p>Sistema de Monitoreo de Ofertas Chile Compra</p>
              <p>Generado automáticamente el ${new Date().toLocaleString("es-CL")}</p>
            </div>
          </div>
        </body>
        </html>
      `;
        }

        const ofertasHTML = ofertas
            .map(
                (oferta) => `
      <tr style="border-bottom: 1px solid #ecf0f1;">
        <td style="padding: 15px; vertical-align: top;">
          <h3 style="margin: 0 0 10px 0; color: #2c3e50;">
            <a href="${oferta.enlace_ficha}" 
               style="color: #3498db; text-decoration: none;" 
               target="_blank">
              ${oferta.nombre}
            </a>
          </h3>
          <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 8px;">
            <strong>Código:</strong> ${oferta.codigo}
          </div>
          <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 8px;">
            <strong>Organismo:</strong> ${oferta.organismo}
          </div>
          <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 8px;">
            <strong>Unidad:</strong> ${oferta.unidad}
          </div>
          <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 8px;">
            <strong>Estado:</strong> <span style="color: #27ae60;">${oferta.estado}</span>
          </div>
          <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 8px;">
            <strong>Monto:</strong> $${oferta.monto_disponible_CLP.toLocaleString("es-CL")} CLP
          </div>
          <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 8px;">
            <strong>Fecha de Publicación:</strong> ${new Date(oferta.fecha_publicacion).toLocaleString("es-CL")}
          </div>
          <div style="font-size: 14px; color: #e74c3c;">
            <strong>Fecha de Cierre:</strong> ${new Date(oferta.fecha_cierre).toLocaleString("es-CL")}
          </div>
          <div style="font-size: 12px; color: #95a5a6; margin-top: 10px;">
            <strong>Proveedores cotizando:</strong> ${oferta.cantidad_proveedores_cotizando}
          </div>
        </td>
      </tr>
    `
            )
            .join("");

        return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Ofertas - ${emprendimiento}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 1000px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
          .stats { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
          .stats-item { display: inline-block; margin: 0 20px; }
          .stats-number { font-size: 24px; font-weight: bold; color: #3498db; }
          .stats-label { font-size: 14px; color: #7f8c8d; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1; text-align: center; color: #7f8c8d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Reporte de Ofertas</h1>
            <h2>${emprendimiento}</h2>
            <p>Fecha: ${fecha}</p>
          </div>
          
          <div class="stats">
            <div class="stats-item">
              <div class="stats-number">${ofertas.length}</div>
              <div class="stats-label">Ofertas Encontradas</div>
            </div>
            <div class="stats-item">
              <div class="stats-number">$${ofertas.reduce((sum, o) => sum + o.monto_disponible_CLP, 0).toLocaleString("es-CL")}</div>
              <div class="stats-label">Monto Total (CLP)</div>
            </div>
          </div>

          <table>
            <tbody>
              ${ofertasHTML}
            </tbody>
          </table>

          <div class="footer">
            <p>Sistema de Monitoreo de Ofertas Chile Compra</p>
            <p>Generado automáticamente el ${new Date().toLocaleString("es-CL")}</p>
            <p><strong>Nota:</strong> Haz clic en el nombre de cada oferta para ver los detalles completos en el sitio oficial.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    /**
     * Genera el enlace a la ficha de una oferta
     * @param codigo - Código de la oferta
     * @returns string - URL completa a la ficha
     */
    private generateFichaLink(codigo: string): string {
        return `https://buscador.mercadopublico.cl/ficha?code=${codigo}`;
    }

    /**
     * Prepara las ofertas agregando el enlace a la ficha
     * @param ofertas - Array de ofertas
     * @returns OfertaDocument[] - Ofertas con enlaces generados
     */
    private prepareOfertasForEmail(ofertas: OfertaDocument[]): OfertaDocument[] {
        return ofertas.map((oferta) => ({
            ...oferta,
            enlace_ficha: this.generateFichaLink(oferta.codigo),
        }));
    }

    /**
     * Envía un email con el reporte de ofertas
     * @param ofertas - Array de ofertas
     * @param emprendimiento - Nombre del emprendimiento
     * @param recipients - Array de destinatarios
     * @param fecha - Fecha del reporte (opcional)
     * @returns Promise<boolean> - Éxito del envío
     */
    async sendOfertasReport(ofertas: OfertaDocument[], emprendimiento: string, recipients: string[], fecha?: string): Promise<boolean> {
        try {
            const fechaReporte = fecha || new Date().toLocaleDateString("es-CL");
            const ofertasConEnlaces = this.prepareOfertasForEmail(ofertas);

            const emailConfig: EmailConfig = {
                to: recipients,
                subject: `📊 Reporte Diario de Ofertas - ${emprendimiento} (${fechaReporte})`,
                html: this.generateEmailHTML(ofertasConEnlaces, emprendimiento, fechaReporte),
            };

            console.log(`📧 Enviando reporte por email a: ${recipients.join(", ")}`);
            console.log(`📊 Cantidad de ofertas: ${ofertas.length}`);

            const response = await axios.post(this.emailServiceUrl, emailConfig, {
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 30000, // 30 segundos
            });

            if (response.status === 200) {
                console.log("✅ Email enviado exitosamente");
                return true;
            } else {
                console.error("❌ Error en respuesta del servicio de email:", response.status, response.data);
                return false;
            }
        } catch (error: any) {
            console.error("❌ Error enviando email:", error.message);
            if (error.response) {
                console.error("Respuesta del servidor:", error.response.status, error.response.data);
            }
            return false;
        }
    }

    /**
     * Envía un email de notificación de error
     * @param error - Error ocurrido
     * @param emprendimiento - Nombre del emprendimiento
     * @param recipients - Array de destinatarios
     * @returns Promise<boolean> - Éxito del envío
     */
    async sendErrorNotification(error: Error, emprendimiento: string, recipients: string[]): Promise<boolean> {
        try {
            const errorHTML = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Error en Monitoreo - ${emprendimiento}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background-color: #e74c3c; color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
            .error-details { background-color: #fdf2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1; text-align: center; color: #7f8c8d; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Error en Monitoreo</h1>
              <h2>${emprendimiento}</h2>
            </div>
            
            <p>Se ha producido un error durante el proceso de monitoreo de ofertas:</p>
            
            <div class="error-details">
              <h3>Detalles del Error:</h3>
              <p><strong>Mensaje:</strong> ${error.message}</p>
              <p><strong>Fecha y Hora:</strong> ${new Date().toLocaleString("es-CL")}</p>
            </div>

            <p>Por favor, revisa los logs del sistema para más información.</p>

            <div class="footer">
              <p>Sistema de Monitoreo de Ofertas Chile Compra</p>
            </div>
          </div>
        </body>
        </html>
      `;

            const emailConfig: EmailConfig = {
                to: recipients,
                subject: `⚠️ Error en Monitoreo - ${emprendimiento}`,
                html: errorHTML,
            };

            console.log(`🚨 Enviando notificación de error por email...`);

            const response = await axios.post(this.emailServiceUrl, emailConfig, {
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            });

            return response.status === 200;
        } catch (emailError: any) {
            console.error("❌ Error enviando notificación de error por email:", emailError.message);
            return false;
        }
    }

    /**
     * Prueba el servicio de email enviando un email de prueba
     * @param recipient - Destinatario de prueba
     * @returns Promise<boolean> - Éxito de la prueba
     */
    async testEmailService(recipient: string): Promise<boolean> {
        try {
            const testHTML = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>✅ Prueba de Servicio de Email</h2>
            <p>Este es un email de prueba del sistema de monitoreo de Chile Compra.</p>
            <p><strong>Fecha y Hora:</strong> ${new Date().toLocaleString("es-CL")}</p>
            <p>Si recibes este mensaje, el servicio de email está funcionando correctamente.</p>
          </body>
        </html>
      `;

            const emailConfig: EmailConfig = {
                to: recipient,
                subject: "✅ Prueba de Servicio de Email - Chile Compra Monitor",
                html: testHTML,
            };

            const response = await axios.post(this.emailServiceUrl, emailConfig, {
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            });

            return response.status === 200;
        } catch (error: any) {
            console.error("❌ Error en prueba de email:", error.message);
            return false;
        }
    }
}
